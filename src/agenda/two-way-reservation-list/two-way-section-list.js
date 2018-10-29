import React, { Component } from 'react';
import { SectionList, View, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import get from 'lodash.get';

const viewPropTypes = ViewPropTypes || View.propTypes;

export default class extends Component {
  static propTypes = {
    style: viewPropTypes.style,
    contentContainerStyle: viewPropTypes.style,
    getItemLayout: PropTypes.func,
    renderItem: PropTypes.func,
    onMoveShouldSetResponderCapture: PropTypes.func,
    keyExtractor: PropTypes.func,
    onStartReached: PropTypes.func,
    onStartReachedThreshold: PropTypes.number,
    onEndReachedThreshold: PropTypes.number,
    onEndReached: PropTypes.func,
    onScrollHandler: PropTypes.func,
    sections: PropTypes.array
  };

  constructor(props) {
    super(props);
    this.state = {};
    this.startThreshold = 0; // px from top onStartReached will be called
    this.onStartAlreadyCalled = false; // called already for a drag/momentum
    this.secList = null;
  }

  // componentDidUpdate = (prevProps) => {
  //   const oldSections = prevProps.sections;
  //   const newSections = this.props.sections;

  //   if (Array.isArray(oldSections) && Array.isArray(newSections)) {
  //     if (!oldSections.length || !newSections.length) return;

  //     // if items were added to start
  //     if (!isEqual(oldSections[0], newSections[0])) {
  //       const numAdded = newSections.length - oldSections.length;
  //       // XXX probably not the safest way to do this but ¯\_(ツ)_/¯
  //       const currentPos = get(this, '_listRef._wrapperListRef._listRef._scrollMetrics.offset');
  //       // this._listRef.scrollToLocation({
  //       //   sectionIndex: numAdded,
  //       //   itemIndex: numAdded === 0 ? newSections[0].data.length - oldSections[0].data.length : 0,
  //       //   viewOffset: 0, // get the user back to where they were
  //       //   animated: false
  //       // });
  //     }
  //   }
  // };

  render() {
    const { onScrollHandler, onListTouch, onEndReached, ...rest } = this.props;

    return (
      <SectionList
        ref={ref => {
          this.secList = ref;
        }}
        {...rest}
        overScrollMode="never"
        getItemLayout={(data, index) => ({ length: 96, offset: 0, index })}
        onMoveShouldSetResponderCapture={() => {
          this.props.onListTouch();
          return false;
        }}
        keyExtractor={(item, index) => {
          return `${item.reservation.document.id} ${index}`;
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={1}
        onLayout={this.onLayout}
        onScroll={this.onScroll}
        onMomentumScrollEnd={this.onMomentumScrollEnd}
        onScrollBeginDrag={this.onScrollBeginDrag}
        onEndReached={this.onEndReached}
        onStartReachedThreshold={0.01}
        onEndReachedThreshold={0.01}
      />
    );
  }

  scrollToOffset = offset => {
    this.secList._wrapperListRef._listRef.scrollToOffset({
      offset,
      animated: true
    });
  };

  onMomentumScrollEnd = () => {
    // if (e) {
    //   const {
    //     nativeEvent: {
    //       contentOffset: { y }
    //     }
    //   } = e;
    // }

    // if (this.props.onMomentumScrollEnd) {
    //   this.props.onMomentumScrollEnd(e);
    // }
    this.onStartAlreadyCalled = false;
  };

  // reset the callback every time a user starts to drag
  onScrollBeginDrag = () => {
    // if (this.props.onScrollBeginDrag) {
    //   this.props.onScrollBeginDrag(e);
    // }
    this.onStartAlreadyCalled = false;
  };

  onScroll = e => {
    const {
      nativeEvent: {
        contentOffset: { y }
      }
    } = e;

    if (this.props.onScrollHandler && typeof this.props.onScrollHandler === 'function') {
      this.props.onScrollHandler(e);
    }

    // XXX probably not the safest way to do this but ¯\_(ツ)_/¯
    const velocity = get(
      this,
      '_listRef._wrapperListRef._listRef._scrollMetrics.velocity'
    );

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

  onEndReached = () => {
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
