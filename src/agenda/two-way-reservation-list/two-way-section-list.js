import get from 'lodash.get';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Platform, SectionList, View, ViewPropTypes } from 'react-native';

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
    onListTouch: PropTypes.func,
    sections: PropTypes.array
  };

  constructor(props) {
    super(props);
    this.state = {};
    this.startThreshold = 0; // px from top onStartReached will be called
    this.endThreshold = 600; // px from top onStartReached will be called
    this.onStartAlreadyCalled = false; // called already for a drag/momentum
    this.secList = null;
  }

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
          onListTouch();
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
        // onEndReached={this.onEndReached}
        // onStartReachedThreshold={0.01}
        // onEndReachedThreshold={0.01}
      />
    );
  }

  scrollToOffset = (offset, animated) => {
    this.secList._wrapperListRef._listRef.scrollToOffset({
      offset,
      animated
    });
  };

  scrollToSectionAndItem = (section, item) => {
    this.secList.scrollToLocation({
      sectionIndex: section,
      itemIndex: item,
      viewOffset: 0, // get the user back to where they were
      animated: true
    });
  };

  onMomentumScrollEnd = () => {
    this.onStartAlreadyCalled = false;
  };

  // reset the callback every time a user starts to drag
  onScrollBeginDrag = () => {
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
    const velocity = get(this, 'secList._wrapperListRef._listRef._scrollMetrics.velocity');
    const contentLength = get(this, 'secList._wrapperListRef._listRef._scrollMetrics.contentLength');

    if (
      y <= this.startThreshold && // nearing the top
      velocity < 0 && // scrolling _toward_ the top
      !this.onStartAlreadyCalled && // hasn't been called this drag/momentum
      typeof this.props.onStartReached === 'function'
    ) {
      this.onStartAlreadyCalled = true;
      this.props.onStartReached();
    } else if (
      y >= contentLength - this.endThreshold && // nearing the top
      velocity > 0 && // scrolling _toward_ the top
      !this.onStartAlreadyCalled && // hasn't been called this drag/momentum
      typeof this.props.onEndReached === 'function'
    ) {
      this.onStartAlreadyCalled = true;
      this.props.onEndReached();
    }
  };

  // onEndReached = () => {
  //   if (
  //     !this.onStartAlreadyCalled // hasn't been called this drag/momentum
  //   ) {
  //     this.onStartAlreadyCalled = true;
  //     this.props.onEndReached();
  //   }
  // };

  onLayout = e => {
    const { height } = e.nativeEvent.layout;
    const { onLayout, onStartReachedThreshold, onEndReachedThreshold } = this.props;

    onLayout ? onLayout(e) : null;

    const threshold = onStartReachedThreshold ? onStartReachedThreshold : 0;
    const endThreshold = onEndReachedThreshold ? onEndReachedThreshold : 0;
    this.startThreshold = height * threshold;
    this.endThreshold = Platform.select({android: (height + 200) * endThreshold, ios: height * endThreshold});
  };
}
