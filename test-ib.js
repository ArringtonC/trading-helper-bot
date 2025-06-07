const IB = require('@stoqey/ib').default;
const ib = new IB({ port: 7497, clientId: 1 });

ib.on('connected', () => {
  console.log('Connected!');
  ib.disconnect();
});
ib.on('error', (err) => {
  console.error('Error:', err);
});
ib.connect(); 