module.exports = {
  exit: true,
  slow: 20,
  timeout: 2000,
  ui: 'bdd',
  diff: true,
  reporter: 'dot',
  spec: 'test/**/*.test.js',
  'watch-files': ['test/**/*.js'],
  require: ['should']
};
