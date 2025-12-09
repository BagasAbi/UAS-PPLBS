
async function getStatus() {
  return { status: 'Gateway service is running' };
}

module.exports = {
  getStatus,
};
