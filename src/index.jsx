import React from 'react';
import App from './components/anim-container';

/*eslint-disable */
console.log('MAIN JS LOADED');
/*eslint-enable */

const div = document.querySelector('.react');
React.render(<App />, div);

