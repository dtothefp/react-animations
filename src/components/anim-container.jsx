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
    const first = elms.first();
    this.animElms = elms;
    this.state = {
      show: first,
      hide: elms.skipUntil((num, i) => i > 0),
      currentStep: first
    };
  }
  componentDidMount() {
    const refs = this.refs;
    const keys = Object.keys(refs);

    keys.forEach(ref => {
      const elm = React.findDOMNode(this.refs[ref]);
      const num = ref.split('_').slice(-1)[0];

      elm.addEventListener(transitionend, this.handleTransitonEnd(elm, num), false);
    });
  }
  handleTransitonEnd(elm, num) {
    return (e) => {
      const classList = elm.classList;
      const leaving = classList.contains('leave');
      const showing = classList.contains('show');

      if (showing) {
        this.setState(assign({}, this.state, {
          isShowing: false
        }));
      } else if (leaving) {
        this.setState(assign({}, this.state, {
          isHiding: false,
          leave: false,
          hide: this.state.hide.push(num)
        }));
      }
    };
  }
  handleClick(e) {
    e.preventDefault();
    let {currentStep} = this.state;
    let isShowing, isHiding;
    const lastStep = currentStep;

    if (currentStep === this.animElms.size) {
      currentStep = this.animElms.first();
    } else {
      currentStep += 1;
    }
    isShowing = currentStep;
    isHiding = lastStep;

    const animElms = toImmutable([isHiding, isShowing]);
    const newState = {
      hide: this.animElms.filter(key => !animElms.includes(key)),
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
    const divs = this.animElms.map(key => {
      const ref = `div_${key}`;
      return <Div num={key} parentState={this.state} key={ref} ref={ref} />;
    }).toJS();

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
