
  var element = document.createElement('script');
  element.id = 'outfox_seed_js';
  element.charset = 'utf-8',
  element.setAttribute('src', 'http://fanyi.youdao.com/web2/seed.js?' + Date.parse(new Date()));
  document.body.appendChild(element);
