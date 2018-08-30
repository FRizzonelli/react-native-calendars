import React, { Component } from 'react';
import { SectionList } from 'react-native';
import PropTypes from 'prop-types';
import get from 'lodash.get';
import isEqual from 'lodash.isequal';

// type Props = {
//   onStartReached?: ?(info: { distanceFromEnd: number }) => void,
//   onStartReachedThreshold?: ?number,
//   onMomentumScrollEnd?: ScrollEvent => any,
//   onScrollBeginDrag?: ScrollEvent => any,
//   onScroll?: ScrollEvent => any,
//   onLayout?: LayoutEvent => any
// };

export default class extends Component {
  // static defaultProps = {
  //   onStartReachedThreshold: 0
  // };
  _listRef;

  static propTypes = {
    onStartReached: PropTypes.func,
    onStartReachedThreshold: PropTypes.number,
    onRef: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {};
    this.startThreshold = 0; // px from top onStartReached will be called
    this.onStartAlreadyCalled = false; // called already for a drag/momentum
  }

  componentWillUnmount() {
    if (this.props.onRef != null) {
      this.props.onRef(null);
    }
  }

  componentDidUpdate = (prevProps) => {
    const oldSections = prevProps.sections;
    const newSections = this.props.sections;

    if (Array.isArray(oldSections) && Array.isArray(newSections)) {
      if (!oldSections.length || !newSections.length) return;

      // if items were added to start
      if (!isEqual(oldSections[0], newSections[0])) {
        const numAdded = newSections.length - oldSections.length;
        // XXX probably not the safest way to do this but ¯\_(ツ)_/¯
        const currentPos = get(this, '_listRef._wrapperListRef._listRef._scrollMetrics.offset');
        // this._listRef.scrollToLocation({
        //   sectionIndex: numAdded,
        //   itemIndex: numAdded === 0 ? newSections[0].data.length - oldSections[0].data.length : 0,
        //   viewOffset: 0, // get the user back to where they were
        //   animated: false
        // });
      }
    }
  };

  render = () => (
    <SectionList
      {...this.props}
      overScrollMode="never"
      ref={ref => {
        this._listRef = ref;
        if (this.props.onRef) {
          this.props.onRef(this._listRef);
        }
      }}
      onLayout={this.onLayout}
      onScroll={this.onScroll}
      onMomentumScrollEnd={this.onMomentumScrollEnd}
      onScrollBeginDrag={this.onScrollBeginDrag}
      onEndReached={this.onEndReached}
    />
  );

  onMomentumScrollEnd = e => {
    if (e) {
      const {
        nativeEvent: {
          contentOffset: { y }
        }
      } = e;
    }

    if (this.props.onMomentumScrollEnd) {
      this.props.onMomentumScrollEnd(e);
    }
    this.onStartAlreadyCalled = false;
  };

  // reset the callback every time a user starts to drag
  onScrollBeginDrag = e => {
    if (this.props.onScrollBeginDrag) {
      this.props.onScrollBeginDrag(e);
    }
    this.onStartAlreadyCalled = false;
  };

  onScroll = e => {
    const {
      nativeEvent: {
        contentOffset: { y }
      }
    } = e;

    if (this.props.onScroll && typeof this.props.onScroll === 'function') {
      this.props.onScroll(e);
    }

    // XXX probably not the safest way to do this but ¯\_(ツ)_/¯
    const velocity = get(this, '_listRef._wrapperListRef._listRef._scrollMetrics.velocity');

    if (
      y <= this.startThreshold && // nearing the top
      velocity < 0 && // scrolling _toward_ the top
      !this.onStartAlreadyCalled && // hasn't been called this drag/momentum
      typeof this.props.onStartReached === 'function'
    ) {
      this.onStartAlreadyCalled = true;
      this.props.onStartReached();
    }
  };

  onEndReached = e => {
    if (
      !this.onStartAlreadyCalled // hasn't been called this drag/momentum
    ) {
      this.onStartAlreadyCalled = true;
      this.props.onEndReached();
    }
  };

  onLayout = e => {
    const { height } = e.nativeEvent.layout;
    const { onLayout, onStartReachedThreshold } = this.props;

    onLayout ? onLayout(e) : null;

    const threshold = onStartReachedThreshold ? onStartReachedThreshold : 0;
    this.startThreshold = height * threshold;
  };
}