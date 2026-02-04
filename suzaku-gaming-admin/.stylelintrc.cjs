module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recess-order',
    'stylelint-config-html/vue'
  ],
  plugins: ['stylelint-order'],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html'
    }
  ],
  rules: {
    // 允许使用 @forward, @use 等 SCSS 语法
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    
    // 选择器类名格式
    'selector-class-pattern': null,
    
    // 允许 Element Plus 变量命名
    'scss/dollar-variable-pattern': null,
    
    // 允许空源文件
    'no-empty-source': null,
    
    // 颜色格式
    'color-hex-length': 'long',
    
    // 允许 !important
    'declaration-no-important': null,
    
    // 字体族
    'font-family-no-missing-generic-family-keyword': null,
    
    // 媒体查询
    'media-feature-range-notation': null
  },
  ignoreFiles: ['dist/**', 'node_modules/**']
};
