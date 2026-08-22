select cron.unschedule('price-alerts-check') where exists (select 1 from cron.job where jobname = 'price-alerts-check');

select cron.schedule(
  'price-alerts-check',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://project--cd5f01d4-52a6-4098-b7a4-ac17de575c63.lovable.app/api/public/jobs/price-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'email_queue_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);