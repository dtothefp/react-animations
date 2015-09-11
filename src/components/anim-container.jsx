import React, {Component} from 'react';
import {assign} from 'lodash';
import Div from './anim-elm';

const transitionend = (function(transition) {
  const transEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',// Saf 6, Android Browser
    'MozTransition': 'transitionend',      // only for FF < 15
    'transition': 'transitionend'       // IE10, Opera, Chrome, FF 15+, Saf 7+
  };

  return transEndEventNames[transition];
})(window.Modernizr.prefixed('transition'));

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isTransitioning: false,
      currentStep: 1,
      lastStep: null
    };
  }
  componentDidMount() {
    const refs = this.refs;
    const keys = Object.keys(refs);

    keys.forEach(ref => {
      const elm = React.findDOMNode(this.refs[ref]);
      elm.addEventListener(transitionend, (e) => {
        console.log(e, elm);
      }, false);
    });
  }
  handleClick(e) {
    e.preventDefault();
    let {currentStep} = this.state;
    const lastStep = currentStep;
    const hideRef = `div_${currentStep}`;
    let isShowing, isHiding;
    console.log('HIDE NODE', React.findDOMNode(this.refs[hideRef]));
    if (currentStep === 4) {
      currentStep = 1;
      isHiding = 4;
    } else {
      currentStep += 1;
      isShowing = currentStep;
    }
    const showRef = `div_${currentStep}`;
    console.log('SHOW NODE', React.findDOMNode(this.refs[showRef]));
    this.setState(assign({}, this.state, {
      currentStep,
      isTransitioning: true,
      lastStep,
      isShowing,
      isHiding
    }));
  }
  render() {
    const {currentStep, lastStep} = this.state;
    const divs = [1, 2, 3, 4].map(key => {
      const ref = `div_${key}`;
      return <Div num={key} something="hello" currentStep={currentStep} lastStep={lastStep} ref={ref} />;
    });
    return (
      <div>
        <div className="parent" >
          {divs}
        </div>
        <button onClick={::this.handleClick} >Click</button>
      </div>
    );
  }
}
