import React, {Component, PropTypes} from 'react';
import {assign} from 'lodash';
import cx from 'classnames';

const transitionend = (function(transition) {
  const transEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',// Saf 6, Android Browser
    'MozTransition': 'transitionend',      // only for FF < 15
    'transition': 'transitionend'       // IE10, Opera, Chrome, FF 15+, Saf 7+
  };

  return transEndEventNames[transition];
})(window.Modernizr.prefixed('transition'));

export default class Div extends Component {
  static propTypes = {
    num: PropTypes.number,
    currentStep: PropTypes.number,
    lastStep: PropTypes.number
  };

  constructor(props) {
    super(props);
    const {num} = props;
    this.state = {
      isHiding: false,
      isShowing: false,
      hide: num !== 1,
      show: num === 1
    };
  }
  componentDidMount() {
    const node = React.findDOMNode(this);

    node.addEventListener(transitionend, (e) => {
      const classes = [...node.classList];

      if (classes.indexOf('anim-leave') !== -1) {
        this.setState(assign({}, this.state, {hide: true, anim: false, ['anim-leave']: false}));
      } else if (classes.indexOf('anim-enter') !== -1) {
        this.setState(assign({}, this.state, {['anim-enter']: false}));
      }

    });
  }
  setHide() {
    setTimeout(() => {
      this.setState(assign({}, this.state, {show: false}));
    }, 0);
  }
  setShow() {
    setTimeout(() => {
      this.setState(assign({}, this.state, {show: true}));
    }, 0);
  }
  render() {
    const {hide, show} = this.state;
    const {num, currentStep, lastStep} = this.props;
    const isBecomingVisible = currentStep === num && lastStep;
    const isBecomingHidden = lastStep === num;
    let displayNone;

    if (isBecomingVisible) {
      displayNone = false;
    } else if (isBecomingHidden && !hide) {
      displayNone = false;
    } else if (hide) {
      displayNone = true;
    }

    const classes = cx({
      hide: displayNone,
      show: show,
      anim: isBecomingVisible || isBecomingHidden,
      ['anim-enter']: isBecomingVisible,
      ['anim-leave']: isBecomingHidden
    });

    if (isBecomingVisible) {
      this.setShow();
    } else if (isBecomingHidden) {
      this.setHide();
    }
    const ref = `div_${num}`;
    return <div className={classes} ref={ref} key={ref} ><div>{num}</div></div>;
  }
}


