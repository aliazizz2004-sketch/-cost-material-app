const { spawn } = require('child_process');
const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
  cwd: 'c:/Users/Lenovo/Desktop/cost material/cost-material-app',
  shell: true
});

expo.stdout.on('data', (data) => {
  const str = data.toString();
  console.log(str);
  if (str.includes('exp://')) {
    const match = str.match(/exp:\/\/[\w.-]+\.expo\.direct/);
    if (match) {
        process.send && process.send({url: match[0]});
    }
  }
});

expo.stderr.on('data', (data) => {
  console.error(data.toString());
});
