import groupBy from "lodash.groupby";
import map from "lodash.map";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { ActivityIndicator, View } from "react-native";
import XDate from "xdate";
import dateutils from "../../dateutils";
import Reservation from "./reservation";
import styleConstructor from "./style";
import TwoWaySectionList from "./two-way-section-list";

class ReactComp extends Component {
  static propTypes = {
    // specify your item comparison function for increased performance
    rowHasChanged: PropTypes.func,
    // specify how each item should be rendered in agenda
    renderItem: PropTypes.func,
    // specify how each date should be rendered. day can be undefined if the item is not first in that day.
    renderDay: PropTypes.func,
    // specify how empty date content with no items should be rendered
    renderEmptyDate: PropTypes.func,
    // callback that gets called when day changes while scrolling agenda list
    onDayChange: PropTypes.func,
    // onScroll ListView event
    onScroll: PropTypes.func,
    // the list of items that have to be displayed in agenda. If you want to render item as empty date
    // the value of date key kas to be an empty array []. If there exists no value for date key it is
    // considered that the date in question is not yet loaded
    reservations: PropTypes.object,
    onStartReached: PropTypes.func,
    onEndReached: PropTypes.func,

    selectedDay: PropTypes.instanceOf(XDate),
    initialDay: PropTypes.instanceOf(XDate),
    refreshControl: PropTypes.element,
    refreshing: PropTypes.bool,
    onRefresh: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.styles = styleConstructor(props.theme);
    this.state = {
      reservations: []
    };
    this.heights = [];
    this.selectedDay = this.props.selectedDay;
    this.scrollOver = true;
    this.twoWayList = null;
  }

  componentWillMount() {
    this.updateDataSource(this.getReservations(this.props).reservations);
  }

  updateDataSource(reservations) {
    this.setState({
      reservations
    });
  }

  updateReservations(props) {
    const reservations = this.getReservations(props);

    if (
      this.twoWayList &&
      (!dateutils.sameDate(props.selectedDay, this.selectedDay) ||
        this.state.reservations.length < reservations.reservations.length)
    ) {
      let scrollPosition = 0;
      for (let i = 0; i < reservations.scrollPosition; i++) {
        scrollPosition += this.heights[i] || 0;
      }
      this.scrollOver = false;

      // this.list.scrollToOffset({ offset: scrollPosition, animated: true });
      this.twoWayList.scrollToOffset(scrollPosition);
      // this.list.scrollToLocation({
      //   sectionIndex: 0,
      //   itemIndex: scrollPosition,
      //   viewOffset: 35, // get the user back to where they were
      //   animated: true
      // });
    }
    this.selectedDay = props.selectedDay;
    this.updateDataSource(reservations.reservations);
  }

  componentWillReceiveProps(props) {
    if (!dateutils.sameDate(props.initialDay, this.props.initialDay)) {
      this.setState(
        {
          reservations: []
        },
        () => {
          this.updateReservations(props);
        }
      );
    } else {
      this.updateReservations(props);
    }
  }

  onScrollHandler(event) {
    const yOffset = event.nativeEvent.contentOffset.y;
    if (this.props.onScroll && typeof this.props.onScroll === "function") {
      this.props.onScroll(yOffset);
    }
    let topRowOffset = 0;
    let topRow;
    for (topRow = 0; topRow < this.heights.length; topRow++) {
      if (topRowOffset + this.heights[topRow] / 2 >= yOffset) {
        break;
      }
      topRowOffset += this.heights[topRow];
    }
    const row = this.state.reservations[topRow];
    if (!row) return;
    const day = row.day;
    const sameDate = dateutils.sameDate(day, this.selectedDay);
    if (!sameDate && this.scrollOver) {
      this.selectedDay = day.clone();
      this.props.onDayChange(day.clone());
      // this.scrollOver = false;
    }
  }

  onRowLayoutChange(ind, event) {
    this.heights[ind] = event.nativeEvent.layout.height;
  }

  renderRow({ item, index }) {
    return (
      <View onLayout={this.onRowLayoutChange.bind(this, index)}>
        <Reservation
          item={item}
          renderItem={this.props.renderItem}
          renderDay={this.props.renderDay}
          renderEmptyDate={this.props.renderEmptyDate}
          theme={this.props.theme}
          rowHasChanged={this.props.rowHasChanged}
        />
      </View>
    );
  }

  getReservationsForDay(iterator, props) {
    const day = iterator.clone();
    const res = props.reservations[day.toString("yyyy-MM-dd")];
    if (res && res.length) {
      return res.map((reservation, i) => {
        return {
          reservation,
          date: i ? false : day,
          day
        };
      });
    } else if (res) {
      return [
        {
          date: iterator.clone(),
          day
        }
      ];
    } else {
      return false;
    }
  }

  onListTouch() {
    this.scrollOver = true;
  }

  getReservations(props) {
    if (!props.reservations || !props.selectedDay) {
      return { reservations: [], scrollPosition: 0 };
    }
    let reservations = [];

    let scrollPosition = 0;

    for (let i = 0; i < Object.keys(props.reservations).length; i++) {
      const day = XDate(new Date(Object.keys(props.reservations)[i]));

      if (day.getTime() < props.selectedDay.getTime()) {
        scrollPosition +=
          props.reservations[Object.keys(props.reservations)[i]].length;
      }

      const res = this.getReservationsForDay(day, props);
      if (!res) {
        reservations = [];
        break;
      } else {
        reservations = reservations.concat(res);
      }
    }

    return { reservations, scrollPosition };
  }

  render() {
    if (!this.props.reservations) {
      if (this.props.renderEmptyData) {
        return this.props.renderEmptyData();
      }
      return <ActivityIndicator style={{ marginTop: 80 }} />;
    }

    const sections = this.getSectionsByDay(this.state.reservations);

    return (
      <TwoWaySectionList
        ref={c => (this.twoWayList = c)}
        style={this.props.style}
        contentContainerStyle={this.styles.content}
        renderItem={this.renderRow.bind(this)}
        sections={sections}
        getItemLayout={(data, index) => ({ length: 96, offset: 0, index })}
        onScrollHandler={this.onScrollHandler.bind(this)}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={200}
        onListTouch={this.onListTouch.bind(this)}
        keyExtractor={(item, index) => String(index)}
        refreshControl={this.props.refreshControl}
        refreshing={this.props.refreshing || false}
        onRefresh={this.props.onRefresh}
        onStartReachedThreshold={0.01}
        onEndReachedThreshold={0.01}
        onStartReached={this.props.onStartReached}
        onEndReached={this.props.onEndReached}
      />
    );
  }

  getSectionsByDay(reservations) {
    const groupedData = groupBy(reservations, reservation => {
      reservation.date;
    });

    return map(groupedData, (group, day) => {
      return {
        title: day,
        data: group
      };
    });
  }
}

export default ReactComp;
