import React from 'react';
import moment from 'moment';
import {} from 'moment-range';
import calendar from 'calendar';
import Immutable from 'immutable';

import BemMixin from '../utils/BemMixin';
import CustomPropTypes from '../utils/CustomPropTypes';
import isMomentRange from '../utils/isMomentRange';
import PureRenderMixin from '../utils/PureRenderMixin';

const lang = moment().localeData();

const WEEKDAYS = Immutable.List(lang._weekdays).zip(Immutable.List(lang._weekdaysShort));
const MONTHS = Immutable.List(lang._months);


const CalendarMonth = React.createClass({
  mixins: [BemMixin, PureRenderMixin],

  propTypes: {
    dateComponent: React.PropTypes.func,
    disableNavigation: React.PropTypes.bool,
    enabledRange: CustomPropTypes.momentRange,
    firstOfMonth: CustomPropTypes.moment,
    firstOfWeek: React.PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6]),
    hideSelection: React.PropTypes.bool,
    highlightedDate: React.PropTypes.object,
    highlightedRange: React.PropTypes.object,
    onMonthChange: React.PropTypes.func,
    onYearChange: React.PropTypes.func,
    value: CustomPropTypes.momentOrMomentRange,
  },

  getInitialState(){
    return {};
  },

  renderDay(date, i) {
    let {dateComponent: CalendarDate, value, highlightedDate, highlightedRange, hideSelection, enabledRange, ...props} = this.props;
    let d = moment(date);

    let isInSelectedRange;
    let isSelectedDate;
    let isSelectedRangeStart;
    let isSelectedRangeEnd;

    if (!hideSelection && value && moment.isMoment(value) && value.isSame(d, 'day')) {
      isSelectedDate = true;
    } else if (!hideSelection && value && isMomentRange(value) && value.contains(d)) {
      isInSelectedRange = true;

      isSelectedRangeStart = value.start.isSame(d, 'day');
      isSelectedRangeEnd = value.end.isSame(d, 'day');
    }

    return (
      <CalendarDate
        key={i}
        isToday={d.isSame(moment(), 'day')}
        isDisabled={!enabledRange.contains(d)}
        isHighlightedDate={!!(highlightedDate && highlightedDate.isSame(d, 'day'))}
        isHighlightedRangeStart={!!(highlightedRange && highlightedRange.start.isSame(d, 'day'))}
        isHighlightedRangeEnd={!!(highlightedRange && highlightedRange.end.isSame(d, 'day'))}
        isInHighlightedRange={!!(highlightedRange && highlightedRange.contains(d))}
        isSelectedDate={isSelectedDate}
        isSelectedRangeStart={isSelectedRangeStart}
        isSelectedRangeEnd={isSelectedRangeEnd}
        isInSelectedRange={isInSelectedRange}
        date={d}
        {...props} />
    );
  },

  renderWeek(dates, i) {
    let days = dates.map(this.renderDay);
    return (
      <tr className={this.cx({element: 'Week'})} key={i}>{days.toJS()}</tr>
    );
  },

  renderDayHeaders() {
    let {firstOfWeek} = this.props;
    let indices = Immutable.Range(firstOfWeek, 7).concat(Immutable.Range(0, firstOfWeek));

    let headers = indices.map(function(index) {
      let weekday = WEEKDAYS.get(index);
      return (
        <th className={this.cx({element: 'WeekdayHeading'})} key={weekday} scope="col"><abbr title={weekday[0]}>{weekday[1]}</abbr></th>
      );
    }.bind(this));

    return (
      <tr className={this.cx({element: 'Weekdays'})}>{headers.toJS()}</tr>
    );
  },

  handleYearChange(event) {
    let newYear = event.target.value;
    if (newYear.length === 4) {
      this.props.onYearChange(parseInt(newYear, 10));
    } else {
      this.setState({yearInput: newYear});
    }
  },
  handleYearPrevious() {
    let newYear = +this.props.firstOfMonth.year() - 1;
    this.props.onYearChange(newYear);
  },
  handleYearNext() {
    let newYear = +this.props.firstOfMonth.year() + 1;
    this.props.onYearChange(newYear);
  },
  renderHeaderYear() {
    let {firstOfMonth} = this.props;
    let y = this.state.yearInput || firstOfMonth.year();
    let modifiers = {year: true};
    return (
      <span className={this.cx({element: 'MonthHeaderLabel', modifiers})}>
        <div className={this.cx({element: 'ArrowIcon', modifiers: {"previous": true}})} onClick={this.handleYearPrevious} />
        {firstOfMonth.format('YYYY')}
        <div className={this.cx({element: 'ArrowIcon', modifiers: {"next": true}})} onClick={this.handleYearNext} />
        {this.props.disableNavigation ? null : <input type="number" className={this.cx({element: 'MonthHeaderYearInput'})} value={y} onChange={this.handleYearChange} />}
      </span>
    );
  },

  handleMonthChange(event) {
    this.props.onMonthChange(parseInt(event.target.value, 10));
  },

  renderMonthChoice(month, i) {
    let {firstOfMonth, enabledRange} = this.props;
    let disabled = false;
    let year = firstOfMonth.year();

    if (moment({years: year, months: i + 1, date: 1}).unix() < enabledRange.start.unix()) {
      disabled = true;
    }

    if (moment({years: year, months: i, date: 1}).unix() > enabledRange.end.unix()) {
      disabled = true;
    }

    return (
      <option key={month} value={i} disabled={disabled ? 'disabled' : null}>{month}</option>
    );
  },

  renderHeaderMonth() {
    let {firstOfMonth} = this.props;
    let choices = MONTHS.map(this.renderMonthChoice);
    let modifiers = {month: true};

    return (
      <span className={this.cx({element: 'MonthHeaderLabel', modifiers})}>
        {firstOfMonth.format('MMMM')}
        {this.props.disableNavigation ? null : <select className={this.cx({element: 'MonthHeaderSelect'})} value={firstOfMonth.month()} onChange={this.handleMonthChange}>{choices.toJS()}</select>}
      </span>
    );
  },

  renderHeader() {
    return (
      <div className={this.cx({element: 'MonthHeader'})}>
        {this.renderHeaderMonth()} {this.renderHeaderYear()}
      </div>
    );
  },

  render() {
    let {firstOfWeek, firstOfMonth} = this.props;

    let cal = new calendar.Calendar(firstOfWeek);
    let monthDates = Immutable.fromJS(cal.monthDates(firstOfMonth.year(), firstOfMonth.month()));
    let weeks = monthDates.map(this.renderWeek);

    return (
      <div className={this.cx({element: 'Month'})}>
        {this.renderHeader()}
        <table className={this.cx({element: 'MonthDates'})}>
          <thead>
            {this.renderDayHeaders()}
          </thead>
          <tbody>
            {weeks.toJS()}
          </tbody>
        </table>
      </div>
    );
  },
});

export default CalendarMonth;
