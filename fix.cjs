const fs = require('fs');
let html = fs.readFileSync('dist/index.html', 'utf8');
html = html.replace(/<script type="module"\s*crossorigin>/g, '<script>');
fs.writeFileSync('dist/index.html', html);
console.log('Fixed index.html');
