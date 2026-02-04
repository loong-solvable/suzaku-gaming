const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Sidebar/index.vue', 'utf8');

// 移除 "新增归因更改" 菜单项
content = content.replace(
  /,\s*\{ path: "\/audit\/new-attribution", title: "新增归因更改" \}/,
  ''
);

fs.writeFileSync('src/components/layout/Sidebar/index.vue', content, 'utf8');
console.log('Done');
