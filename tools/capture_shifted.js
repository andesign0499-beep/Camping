const { execFileSync } = require('child_process');
const fs = require('fs');

const testHtml = fs.readFileSync('index.html', 'utf8')
  .replace('id="my-camp-screen" class="my-camp-screen" style="display: none;"', 'id="my-camp-screen" class="my-camp-screen" style="display: block;"')
  .replace('</body>', '<script>window.addEventListener("load", () => { if (typeof renderMyCampScene === "function") renderMyCampScene(); });</script></body>');

fs.writeFileSync('test_live_shifted.html', testHtml);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outPath = 'C:\\Users\\QUOCBAO\\.gemini\\antigravity\\brain\\e2fbaf8e-c2e5-4d35-8e73-528b1627ceba\\live_shifted_final.png';

execFileSync(edgePath, [
  '--headless',
  '--disable-gpu',
  '--screenshot=' + outPath,
  '--window-size=412,915',
  'http://localhost:8080/test_live_shifted.html'
]);

fs.unlinkSync('test_live_shifted.html');
console.log('Capture finished successfully!');
