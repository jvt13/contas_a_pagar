module.exports = {
  apps: [
    {
      name: 'contas-api',
      cwd: '/var/www/contas_a_pagar',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
    },
  ],
};
