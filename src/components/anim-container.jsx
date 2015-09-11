import React, {Component} from 'react';
import {toImmutable} from 'nuclear-js';
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
    const elms = toImmutable([1, 2, 3, 4]);
    this.animElms = elms;
    this.state = {
      show: elms.first(),
      hide: elms.skipUntil((num, i) => i > 0),
      currentStep: 1
    };
  }
  componentDidMount() {
    const refs = this.refs;
    const keys = Object.keys(refs);

    keys.forEach(ref => {
      const elm = React.findDOMNode(this.refs[ref]);
      const num = ref.split('_').slice(-1)[0];
      const self = this;

      elm.addEventListener(transitionend, function(id, e) {
        const classList = this.classList;
        const leaving = classList.contains('leave');
        const showing = classList.contains('show');

        if (showing) {
          self.setState(assign({}, self.state, {
            isShowing: false
          }));
        } else if (leaving) {
          self.setState(assign({}, self.state, {
            isHiding: false,
            leave: false,
            hide: self.state.hide.push(id)
          }));
        }

      }.bind(elm, +(num)), false);
    });
  }
  handleClick(e) {
    e.preventDefault();
    let {currentStep} = this.state;
    let isShowing, isHiding;
    const lastStep = currentStep;

    if (currentStep === 4) {
      currentStep = 1;
    } else {
      currentStep += 1;
    }
    isShowing = currentStep;
    isHiding = lastStep;

    const animElms = [isHiding, isShowing];
    const newState = {
      hide: this.animElms.filter(key => animElms.indexOf(key) === -1),
      isShowing,
      isHiding,
      currentStep,
      show: null
    };

    this.setState(assign({}, this.state, newState), () => {
      const elm = React.findDOMNode(this);
      // force a re-draw
      elm.offsetHeight;

      const animState = {
        show: isShowing,
        leave: isHiding
      };
      this.setState(assign({}, this.state, animState));
    });
  }
  render() {
    const {isShowing, isHiding} = this.state;
    const divs = [1, 2, 3, 4].map(key => {
      const ref = `div_${key}`;
      return <Div num={key} parentState={this.state} ref={ref} />;
    });
    const props = {};

    if (!isShowing && !isHiding) {
      assign(props, {onClick: ::this.handleClick});
    }

    return (
      <div>
        <div className="parent" >
          {divs}
        </div>
        <button {...props} >Click</button>
      </div>
    );
  }
}
