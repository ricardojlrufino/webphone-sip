
document.addEventListener('WEBPHONE_ONCLICK', (e/*: Object*/) => {
    console.log("Webphone clicked link : " +  e.detail);
    chrome.runtime.sendMessage({type: 'WEBPHONE_ONCLICK', tel: e.detail});
});

var valid = document.getElementsByClassName('webphone_link');
if (valid.length > 0) {
  console.log('webphone already initialized');
} else {

    // hook (and maintain) all tel links
    // window.setInterval(() => {
    [].forEach.call(document.getElementsByTagName('A'), (tag/*: Object*/) => {
        if (typeof tag.href === 'string' && tag.href.toLowerCase().startsWith('tel:')) {
        tag.className += ' webphone_link';
        tag.href = `javascript:document.dispatchEvent(new CustomEvent('WEBPHONE_ONCLICK', { 'detail': '${ tag.href.substr(4) }'}));`
        // tag.title = `(Call using Browser)${ tag.title ? (` ${tag.title}`) : ''}`
        }
    })
    // }, 1000);

}


