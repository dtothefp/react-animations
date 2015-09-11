import React, {Component, PropTypes} from 'react';
import cx from 'classnames';

export default class Div extends Component {
  static propTypes = {
    num: PropTypes.number,
    parentState: PropTypes.object
  };
  render() {
    const {num, parentState} = this.props;
    const {isShowing, isHiding, show, hide, leave} = parentState;
    const showing = isShowing === num;
    const hiding = isHiding === num;
    const showThisElm = show === num;
    const hideThisElm = leave === num;
    const displayNone = hide.indexOf(num) !== -1;
    const ref = `div_${num}`;
    const hslaColor = num * 90;

    const classes = cx({
      hide: displayNone,
      show: showThisElm,
      leave: hideThisElm,
      anim: showing || hiding,
      ['anim-enter']: showing,
      ['anim-leave']: hiding
    });

    return (
      <div className={classes} ref={ref} key={ref} style={{backgroundColor: `hsla(${hslaColor}, 50%, 45%, 1)`}} >
        <div>{num}</div>
      </div>
    );
  }
}


