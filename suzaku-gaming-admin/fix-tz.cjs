const fs = require('fs');
let content = fs.readFileSync('src/views/PlayerData/components/RoleListFilter.vue', 'utf8');

// 生成时区选项
const timezones = [];
// 正时区 +00:00 到 +14:00
for (let h = 0; h <= 14; h++) {
  timezones.push(`+${String(h).padStart(2, '0')}:00`);
  if (h < 14) {
    timezones.push(`+${String(h).padStart(2, '0')}:30`);
  }
}
// 负时区 -00:30 到 -12:00
for (let h = 0; h <= 12; h++) {
  if (h === 0) {
    timezones.push('-00:30');
  } else {
    timezones.push(`-${String(h).padStart(2, '0')}:00`);
    if (h < 12) {
      timezones.push(`-${String(h).padStart(2, '0')}:30`);
    }
  }
}

const optionsStr = timezones.map(tz => `  { label: "${tz}", value: "${tz}" }`).join(',\n');
const newTimezoneOptions = `const timezoneOptions = [\n${optionsStr}\n];`;

// 用正则替换
content = content.replace(
  /const timezoneOptions = \[[\s\S]*?\];/,
  newTimezoneOptions
);

// 设置默认值
content = content.replace(/timezone: "",/g, 'timezone: "+00:00",');

fs.writeFileSync('src/views/PlayerData/components/RoleListFilter.vue', content, 'utf8');
console.log('Done - timezones:', timezones.length);
