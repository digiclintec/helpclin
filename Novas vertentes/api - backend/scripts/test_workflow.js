import pool from '../src/database.js';

async function testWorkflow() {
  console.log('--- Iniciando Teste de Integração do Fluxo de Pagamento e Perfis ---');

  // 1. Verificar suporte aos roles 'technician' e 'client'
  console.log('1. Testando atualização de perfis (technician / client)...');
  const userRes = await pool.query("SELECT id, name, email, role FROM users WHERE email = 'digiclintec@gmail.com'");
  if (userRes.rowCount > 0) {
    const userId = userRes.rows[0].id;
    // Alterar para technician
    await pool.query("UPDATE users SET role = 'technician' WHERE id = $1", [userId]);
    const checkTech = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
    console.log('   Perfil atualizado para:', checkTech.rows[0].role);
    if (checkTech.rows[0].role !== 'technician') throw new Error('Falha ao definir technician');
  }

  // 2. Encontrar ou criar uma ordem concluída para teste
  console.log('2. Buscando ordem de serviço para testar fluxo de pagamento...');
  let orderRes = await pool.query("SELECT id, order_number, status, completed_at FROM service_orders LIMIT 1");
  if (orderRes.rowCount === 0) {
    console.log('   Nenhuma ordem encontrada.');
    return;
  }
  const orderId = orderRes.rows[0].id;
  const orderNum = orderRes.rows[0].order_number;
  console.log(`   Testando com a OS-${orderNum} (ID: ${orderId})`);

  // Colocar como completed/billing_pending
  await pool.query("UPDATE service_orders SET status = 'billing_pending', completed_at = NOW() - INTERVAL '5 days', billed_at = NULL, payment_informed_at = NULL WHERE id = $1", [orderId]);
  console.log('   OS configurada como billing_pending');

  // 3. Cliente informa o pagamento
  console.log('3. Cliente informa o pagamento (data: 2026-09-17)...');
  const paymentDate = '2026-09-17T12:00:00Z';
  const informRes = await fetch(`http://localhost:3333/api/service-orders/${orderId}/inform-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentDate })
  });
  const informData = await informRes.json();
  console.log('   Status retornado:', informData.order?.status, '| payment_informed_at:', informData.order?.payment_informed_at);
  if (informData.order?.status !== 'payment_informed') throw new Error('Status deveria ser payment_informed');

  // 4. Técnico informa NÃO (pagamento NÃO recebido) -> Reverte para billing_pending
  console.log('4. Técnico informa NÃO recebido...');
  const rejectRes = await fetch(`http://localhost:3333/api/service-orders/${orderId}/reject-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Comprovante não localizado no extrato' })
  });
  const rejectData = await rejectRes.json();
  console.log('   Status retornado após recusa:', rejectData.order?.status, '| billed_at:', rejectData.order?.billed_at, '| motivo:', rejectData.order?.payment_rejection_reason);
  if (rejectData.order?.status !== 'billing_pending') throw new Error('Status deveria ter revertido para billing_pending');

  // 5. Cliente informa novamente o pagamento
  console.log('5. Cliente informa o pagamento novamente...');
  const reInformRes = await fetch(`http://localhost:3333/api/service-orders/${orderId}/inform-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentDate: '2026-09-18T12:00:00Z' })
  });
  const reInformData = await reInformRes.json();
  console.log('   Status retornado:', reInformData.order?.status);
  if (reInformData.order?.status !== 'payment_informed') throw new Error('Status deveria ser payment_informed novamente');

  // 6. Técnico confirma SIM (pagamento recebido) -> Finaliza como billed
  console.log('6. Técnico confirma SIM (recebido)...');
  const confirmRes = await fetch(`http://localhost:3333/api/service-orders/${orderId}/confirm-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const confirmData = await confirmRes.json();
  console.log('   Status retornado após confirmação:', confirmData.order?.status, '| billed_at:', confirmData.order?.billed_at);
  if (confirmData.order?.status !== 'billed') throw new Error('Status deveria ser billed');

  console.log('--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
  await pool.end();
}

testWorkflow().catch(err => {
  console.error('ERRO NO TESTE:', err);
  process.exit(1);
});
