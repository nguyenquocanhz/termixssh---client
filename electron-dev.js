// electron-dev.js
// Fixes 'app is undefined' when running inside an IDE that sets ELECTRON_RUN_AS_NODE=1
delete process.env.ELECTRON_RUN_AS_NODE;
const { spawn } = require('child_process');
const electron = require('electron');

const child = spawn(electron, ['.'], { stdio: 'inherit', shell: true });
child.on('close', (code) => {
    process.exit(code);
});
