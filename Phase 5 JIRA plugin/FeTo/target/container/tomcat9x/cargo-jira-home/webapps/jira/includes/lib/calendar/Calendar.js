/*  Copyright Mihai Bazon, 2002-2005  |  www.bazon.net/mishoo
 * -----------------------------------------------------------
 *
 * The DHTML Calendar, version 1.0 "It is happening again"
 *
 * Details and latest version at:
 * www.dynarch.com/projects/calendar
 *
 * This script is developed by Dynarch.com.  Visit us at www.dynarch.com.
 *
 * This script is distributed under the GNU Lesser General Public License.
 * Read the entire license text here: http://www.gnu.org/licenses/lgpl.html
 */

// NOTE: we have modified calendar-ko.js to resolve JRA-7729, we added the month character to the
// Calendar._SMN (short month names) array values, this is what java expects
//
// NOTE: there is a further modification to resolve JRA-8703, we added the Calendar._SMN (short month names) and
// Calendar._SDN (short week names) to the calendar-nl.js.
//
// $Id: calendar.js,v 1.4 2006/10/20 04:34:05 jkoke Exp $

/** The Calendar object constructor. */
/*
 * @deprecated since Jira 8.0
 **/
Calendar = function (firstDayOfWeek, dateStr, todayDateStr, onSelected, onClose) {
	// member variables
	this.activeDiv = null;
	this.currentDateEl = null;
	this.getDateStatus = null;
	this.getDateToolTip = null;
	this.getDateText = null;
	this.timeout = null;
	this.onSelected = onSelected || null;
	this.onClose = onClose || null;
	this.dragging = false;
	this.hidden = false;
	this.minYear = 1970;
	this.maxYear = 2050;
	this.dateFormat = Calendar._TT["DEF_DATE_FORMAT"];
	this.ttDateFormat = Calendar._TT["TT_DATE_FORMAT"];
	this.isPopup = true;
	this.weekNumbers = true;

	this.firstDayOfWeek = typeof firstDayOfWeek == "number" ? firstDayOfWeek : Calendar._FD; // 0 for Sunday, 1 for Monday, etc.
	this.showsOtherMonths = false;
	this.dateStr = dateStr;
	this.todayDateStr = todayDateStr;
	this.ar_days = null;
	this.showsTime = false;
	this.time24 = true;
	this.yearStep = 2;
	this.hiliteToday = true;
	this.multiple = null;
	// HTML elements
	this.table = null;
	this.element = null;
	this.tbody = null;
	this.firstdayname = null;
	// Combo boxes
	this.monthsCombo = null;
	this.yearsCombo = null;
	this.activeMonth = null;
	this.activeYear = null;
	// Information
	this.dateClicked = false;

	// one-time initializations
	if (typeof Calendar._SDN == "undefined") {
		// table of short day names
		if (typeof Calendar._SDN_len == "undefined") {
			Calendar._SDN_len = 3;
		}
		var ar = new Array();
		for (var i = 8; i > 0; ) {
			ar[--i] = Calendar._DN[i].substr(0, Calendar._SDN_len);
		}
		Calendar._SDN = ar;
		// table of short month names
		if (typeof Calendar._SMN_len == "undefined") {
			Calendar._SMN_len = 3;
		}
		ar = new Array();
		for (var i = 12; i > 0; ) {
			ar[--i] = Calendar._MN[i].substr(0, Calendar._SMN_len);
		}
		Calendar._SMN = ar;
	}
};

// ** constants

/// "static", needed for event handlers.
Calendar._C = null;
Calendar._TargetTypes = {
	Title: "title",
	PrevYear: "prev_year",
	PrevMonth: "prev_month",
	GoToday: "go_today",
	NextMonth: "next_month",
	NextYear: "next_year",
	WeekDayName: "week_day",
	Day: "day",
	Hours: "hours",
	Minutes: "minutes",
	AmPm: "am_pm",
	Confirm: "confirm",
	Cancel: "cancel",
};

// BEGIN: UTILITY FUNCTIONS; beware that these might be moved into a separate
//        library, at some point.

Calendar._createFocusHandler = function (calendarElement) {
	return function (ev) {
		if (ev.key !== "Tab") {
			return;
		}
		var activeElement = document.activeElement;
		var focusableElements = calendarElement.querySelectorAll("button:not([tabindex='-1']), [tabindex='0']");
		var firstElement = focusableElements[0];
		var lastElement = focusableElements[focusableElements.length - 1];

		var isFirstInteractiveElementFocused = activeElement === firstElement;
		var isCalendarTitleFocused = activeElement.tagName === "H2";
		var isLastInteractiveElementFocused = activeElement === lastElement;

		if (ev.shiftKey && (isFirstInteractiveElementFocused || isCalendarTitleFocused)) {
			lastElement.focus();
			ev.preventDefault();
		} else if (!ev.shiftKey && isLastInteractiveElementFocused) {
			firstElement.focus();
			ev.preventDefault();
		}
		// This is required for parent elements (e.g. dialogs) to not steal the focus from the calendar
		ev.stopPropagation();
	};
};

Calendar._resetTabindex = function (calendar, dateElToBeFocused) {
	calendar.table.querySelectorAll(".day[tabindex='0']").forEach(function (el) {
		el.setAttribute("tabindex", -1);
	});
	dateElToBeFocused.setAttribute("tabindex", 0);
};

Calendar._isTimeTarget = function (el) {
	var targetTypes = Calendar._TargetTypes;
	return [targetTypes.Hours, targetTypes.Minutes, targetTypes.AmPm].includes(el.navtype);
};

Calendar.getAbsolutePos = function (el) {
	var coords = jQuery(el).offset();
	coords.x = coords.left;
	coords.y = coords.top;
	return coords;
};

Calendar.isRelated = function (el, evt) {
	var related = evt.relatedTarget;
	if (!related) {
		var type = evt.type;
		if (type == "mouseover") {
			related = evt.fromElement;
		} else if (type == "mouseout") {
			related = evt.toElement;
		}
	}
	while (related) {
		if (related == el) {
			return true;
		}
		related = related.parentNode;
	}
	return false;
};

Calendar.removeClass = function (el, className) {
	jQuery(el).removeClass(className);
};

Calendar.addClass = function (el, className) {
	jQuery(el).addClass(className);
};

// FIXME: the following function totally sucks, is useless and should be replaced immediately.
Calendar.getTargetElement = function (ev) {
	var f = ev.target;

	while (f.nodeType !== 1) {
		f = f.parentNode;
	}
	return f;
};

Calendar.stopEvent = function (ev) {
	if (!ev) {
		ev = window.event;
	}
	if (ev.stopPropagation) {
		ev.preventDefault();
		ev.stopPropagation();
	} else {
		ev.cancelBubble = true;
		ev.returnValue = false;
	}
	return false;
};

Calendar.addEvent = function (el, evname, func) {
	Calendar.removeEvent(el, evname, func);
	el.addEventListener(evname, func, true);
};

Calendar.removeEvent = function (el, evname, func) {
	el.removeEventListener(evname, func, true);
};

Calendar.createElement = function (type, parent) {
	var el = document.createElement(type);
	if (typeof parent != "undefined") {
		parent.appendChild(el);
	}
	return el;
};

// END: UTILITY FUNCTIONS

// BEGIN: CALENDAR STATIC FUNCTIONS

/** Internal -- adds a set of events to make some element behave like a button. */
Calendar._assignMouseEvents = function (el, calendar, shouldNotAssignClickEvent) {
	el.calendar = calendar;
	Calendar.addEvent(el, "mouseover", Calendar._setInfoText);
	Calendar.addEvent(el, "mouseout", Calendar._resetInfoText);
	Calendar.addEvent(el, "mousedown", Calendar._handleDragging);

	if (!shouldNotAssignClickEvent) {
		Calendar.addEvent(el, "click", Calendar._handleClick);
	}
};

Calendar.findMonth = function (el) {
	if (typeof el.month != "undefined") {
		return el;
	} else if (typeof el.parentNode.month != "undefined") {
		return el.parentNode;
	}
	return null;
};

Calendar.findYear = function (el) {
	if (typeof el.year != "undefined") {
		return el;
	} else if (typeof el.parentNode.year != "undefined") {
		return el.parentNode;
	}
	return null;
};

Calendar.showMonthsCombo = function () {
	var cal = Calendar._C;
	if (!cal) {
		return false;
	}
	var cal = cal;
	var cd = cal.activeDiv;
	var mc = cal.monthsCombo;
	if (cal.activeMonth) {
		Calendar.removeClass(cal.activeMonth, "active");
	}
	var mon = cal.monthsCombo.getElementsByTagName("div")[cal.date.getMonth()];
	Calendar.addClass(mon, "active");
	cal.activeMonth = mon;
	var s = mc.style;
	s.display = "block";
	if (cd.navtype === Calendar._TargetTypes.PrevMonth) {
		s.left = cd.offsetLeft + "px";
	} else {
		var mcw = mc.offsetWidth;
		if (typeof mcw == "undefined") {
			// Konqueror brain-dead techniques
			mcw = 50;
		}
		s.left = cd.offsetLeft + cd.offsetWidth - mcw + "px";
	}
	s.top = cd.offsetTop + cd.offsetHeight + "px";
};

Calendar.showYearsCombo = function (fwd) {
	var cal = Calendar._C;
	if (!cal) {
		return false;
	}
	var cal = cal;
	var cd = cal.activeDiv;
	var yc = cal.yearsCombo;
	if (cal.activeYear) {
		Calendar.removeClass(cal.activeYear, "active");
	}
	cal.activeYear = null;
	var Y = cal.date.getFullYear() + (fwd ? 1 : -1);
	var yr = yc.firstChild;
	var show = false;
	for (var i = 12; i > 0; --i) {
		if (Y >= cal.minYear && Y <= cal.maxYear) {
			yr.innerHTML = Y;
			yr.year = Y;
			yr.style.display = "block";
			show = true;
		} else {
			yr.style.display = "none";
		}
		yr = yr.nextSibling;
		Y += fwd ? cal.yearStep : -cal.yearStep;
	}
	if (show) {
		var s = yc.style;
		s.display = "block";
		if (cd.navtype === Calendar._TargetTypes.PrevYear) {
			s.left = cd.offsetLeft + "px";
		} else {
			var ycw = yc.offsetWidth;
			if (typeof ycw == "undefined") {
				// Konqueror brain-dead techniques
				ycw = 50;
			}
			s.left = cd.offsetLeft + cd.offsetWidth - ycw + "px";
		}
		s.top = cd.offsetTop + cd.offsetHeight + "px";
	}
};

// event handlers

Calendar.tableMouseUp = function (ev) {
	var cal = Calendar._C;
	if (!cal) {
		return false;
	}
	if (cal.timeout) {
		clearTimeout(cal.timeout);
	}
	var el = cal.activeDiv;
	if (!el) {
		return false;
	}
	var target = Calendar.getTargetElement(ev);
	ev || (ev = window.event);
	var mon = Calendar.findMonth(target);
	var date = null;
	if (mon) {
		date = new Date(cal.date);
		if (mon.month != date.getMonth()) {
			date.setMonth(mon.month);
			cal.setDate(date);
			cal.dateClicked = false;
		}
	} else {
		var year = Calendar.findYear(target);
		if (year) {
			date = new Date(cal.date);
			if (year.year != date.getFullYear()) {
				date.setFullYear(year.year);
				cal.setDate(date);
				cal.dateClicked = false;
			}
		}
	}
	with (Calendar) {
		removeEvent(document, "mouseup", tableMouseUp);
		removeEvent(document, "mouseover", tableMouseOver);
		removeEvent(document, "mousemove", tableMouseOver);
		cal._hideCombos();
		_C = null;
		return stopEvent(ev);
	}
};

Calendar.tableMouseOver = function (ev) {
	var cal = Calendar._C;
	if (!cal) {
		return;
	}
	var el = cal.activeDiv;
	var target = Calendar.getTargetElement(ev);
	ev || (ev = window.event);
	if (Calendar._isTimeTarget(el) && target != el) {
		var pos = Calendar.getAbsolutePos(el);
		var w = el.offsetWidth;
		var x = ev.clientX;
		var dx;
		var decrease = true;
		if (x > pos.x + w) {
			dx = x - pos.x - w;
			decrease = false;
		} else {
			dx = pos.x - x;
		}

		if (dx < 0) {
			dx = 0;
		}
		var range = el._range;
		var current = el._current;
		var count = Math.floor(dx / 10) % range.length;
		for (var i = range.length; --i >= 0; ) {
			if (range[i] == current) {
				break;
			}
		}
		while (count-- > 0) {
			if (decrease) {
				if (--i < 0) {
					i = range.length - 1;
				}
			} else if (++i >= range.length) {
				i = 0;
			}
		}
		var newval = range[i];
		el.innerHTML = newval;

		cal.onUpdateTime();
	}
	return Calendar.stopEvent(ev);
};

Calendar.drag = function (ev) {
	var cal = Calendar._C;
	if (!(cal && cal.dragging)) {
		return false;
	}

	var posX = ev.pageX;
	var posY = ev.pageY;
	var st = cal.element.style;
	st.left = posX - cal.xOffs + "px";
	st.top = posY - cal.yOffs + "px";
	return Calendar.stopEvent(ev);
};

Calendar.endDragging = function (ev) {
	var cal = Calendar._C;
	if (!cal) {
		return false;
	}

	cal.dragging = false;
	Calendar.removeEvent(document, "mousemove", Calendar.drag);
	Calendar.removeEvent(document, "mouseup", Calendar.endDragging);
	Calendar.tableMouseUp(ev);
};

/**
 * Handles all the dragging-related things, like dragging the calendar if it's a popup,
 * or opening combo-menus for month and year navigation buttons.
 */
Calendar._handleDragging = function (ev) {
	var el = ev.target;
	if (el.disabled) {
		return false;
	}
	var cal = el.calendar;
	cal.activeDiv = el;
	Calendar._C = cal;
	if (el.navtype !== Calendar._TargetTypes.Title) {
		with (Calendar) {
			if (Calendar._isTimeTarget(el)) {
				el._current = el.innerHTML;
				addEvent(document, "mousemove", tableMouseOver);
			} else {
				addEvent(document, "mouseover", tableMouseOver);
			}
			addEvent(document, "mouseup", tableMouseUp);
		}
	} else if (cal.isPopup) {
		cal._startDragging(ev);
	}
	if (el.navtype === Calendar._TargetTypes.PrevMonth || el.navtype === Calendar._TargetTypes.NextMonth) {
		if (cal.timeout) {
			clearTimeout(cal.timeout);
		}
		cal.timeout = setTimeout("Calendar.showMonthsCombo()", 250);
	} else if (el.navtype === Calendar._TargetTypes.PrevYear || el.navtype === Calendar._TargetTypes.NextYear) {
		if (cal.timeout) {
			clearTimeout(cal.timeout);
		}
		cal.timeout = setTimeout(
			el.navtype === Calendar._TargetTypes.NextYear
				? "Calendar.showYearsCombo(true)"
				: "Calendar.showYearsCombo(false)",
			250
		);
	} else {
		cal.timeout = null;
	}
	return Calendar.stopEvent(ev);
};

Calendar._setInfoText = function (ev) {
	var el = ev.target;
	if (Calendar.isRelated(el, ev) || Calendar._C || el.disabled) {
		return;
	}
	if (el.ttip) {
		if (el.ttip.substr(0, 1) == "_") {
			el.ttip = el.caldate.print(el.calendar.ttDateFormat) + el.ttip.substr(1);
		}
		el.calendar.infoTextContainer.innerHTML = el.ttip;
	}
	return Calendar.stopEvent(ev);
};

Calendar._resetInfoText = function (ev) {
	with (Calendar) {
		var el = ev.target;
		if (isRelated(el, ev) || _C || el.disabled) {
			return;
		}
		if (el.calendar) {
			el.calendar.infoTextContainer.innerHTML = _TT[el.calendar.showsTime ? "SEL_DATE_TIME" : "SEL_DATE"];
		}
		return stopEvent(ev);
	}
};

Calendar._handleDateClick = function (el) {
	if (el.className.includes("emptycell")) {
		return;
	}
	var cal = el.calendar;
	if (cal.currentDateEl) {
		Calendar.removeClass(cal.currentDateEl, "selected");
		Calendar.addClass(el, "selected");
		cal.currentDateEl = el;
		Calendar._resetTabindex(cal, el);
		el.focus();
	}
	cal.date.setDateOnly(el.caldate);
	var date = cal.date;
	var other_month = !(cal.dateClicked = !el.otherMonth);
	if (!other_month && !cal.currentDateEl) {
		cal._toggleMultipleDate(new Date(date));
	}
	// a date was clicked
	if (other_month) {
		cal._init(cal.firstDayOfWeek, date);
	}
};

Calendar._handleWeekDayNameClick = function (el) {
	el.calendar.setFirstDayOfWeek(el.fdow);
};

Calendar._handleTimeClick = function (el, ev) {
	var range = el._range;
	var current = el.innerHTML;
	for (var i = range.length; --i >= 0; ) {
		if (range[i] == current) {
			break;
		}
	}
	if (ev && ev.shiftKey) {
		if (--i < 0) {
			i = range.length - 1;
		}
	} else if (++i >= range.length) {
		i = 0;
	}
	var newval = range[i];
	el.innerHTML = newval;
	if (el.ariaLabelGenerator) {
		el.ariaLabel = el.ariaLabelGenerator(newval);
	}
	el.calendar.onUpdateTime();
};

/**
 *  A generic "click" handler :) handles all types of buttons defined in this calendar.
 */
Calendar._handleClick = function (ev) {
	var el = ev.target;
	var cal = el.calendar;
	var date = null;
	if (!el.navtype) {
		Calendar._handleDateClick(el);
	} else {
		date = new Date(cal.date);
		if (el.navtype === Calendar._TargetTypes.GoToday) {
			if (cal.todayDateStr) {
				date = new Date(cal.todayDateStr); // TODAY server TZ
			} else {
				// todayDate wasn't passed in, so use local TZ
				// this is same bahaviour as before JRA-45558 fix
				date.setDateOnly(new Date()); // TODAY local TZ
			}
		}
		// unless "today" was clicked, we assume no date was clicked so
		// the selected handler will know not to close the calenar when
		// in single-click mode.

		if (el.navtype === Calendar._TargetTypes.Confirm) {
			cal.callHandler();
			return;
		} else if (el.navtype === Calendar._TargetTypes.Cancel) {
			cal.callCloseHandler();
			return;
		} else if (Calendar._isTimeTarget(el)) {
			Calendar._handleTimeClick(el, ev);
			return;
		} else if (el.navtype === Calendar._TargetTypes.WeekDayName) {
			Calendar._handleWeekDayNameClick(el);
			return;
		}

		cal.dateClicked = false;
		var year = date.getFullYear();
		var mon = date.getMonth();

		function setMonth(m) {
			var day = date.getDate();
			var max = date.getMonthDays(m);
			if (day > max) {
				date.setDate(max);
			}
			date.setMonth(m);
		}

		switch (el.navtype) {
			case Calendar._TargetTypes.PrevYear:
				if (year > cal.minYear) {
					date.setFullYear(year - 1);
				}
				break;
			case Calendar._TargetTypes.PrevMonth:
				if (mon > 0) {
					setMonth(mon - 1);
				} else if (year-- > cal.minYear) {
					date.setFullYear(year);
					setMonth(11);
				}
				break;
			case Calendar._TargetTypes.NextMonth:
				if (mon < 11) {
					setMonth(mon + 1);
				} else if (year < cal.maxYear) {
					date.setFullYear(year + 1);
					setMonth(0);
				}
				break;
			case Calendar._TargetTypes.NextYear:
				if (year < cal.maxYear) {
					date.setFullYear(year + 1);
				}
				break;
			case Calendar._TargetTypes.GoToday:
				// "Go Today" will bring us here
				if (
					typeof cal.getDateStatus == "function" &&
					cal.getDateStatus(date, date.getFullYear(), date.getMonth(), date.getDate())
				) {
					return false;
				}
				break;
		}
		if (!date.equalsTo(cal.date)) {
			cal.setDate(date);
		}
	}
};

// END: CALENDAR STATIC FUNCTIONS

// BEGIN: CALENDAR OBJECT FUNCTIONS

/**
 *  This function creates the calendar inside the given parent.  If _par is
 *  null than it creates a popup calendar inside the BODY element.  If _par is
 *  an element, be it BODY, then it creates a non-popup calendar (still
 *  hidden).  Some properties need to be set before calling this function.
 */
Calendar.prototype.create = function (_par) {
	var cal = this;
	var parent = null;
	if (!_par) {
		// default parent is the document body, in which case we create
		// a popup calendar.
		parent = document.getElementsByTagName("body")[0];
		this.isPopup = true;
	} else {
		parent = _par;
		this.isPopup = false;
	}

	// try to parse the current date/time in ISO8601 format
	if (this.dateStr) {
		this.date = new Date(this.dateStr);
	}

	// fall back to date/time in browser time zone if necessary
	if (!this.date || isNaN(this.date)) {
		this.date = new Date();
	}

	var calendarElement = Calendar.createElement("div");
	this.element = calendarElement;
	Calendar.addClass(calendarElement, "calendar");
	if (this.isPopup) {
		calendarElement.style.position = "absolute";
		calendarElement.style.display = "none";
		calendarElement.role = "dialog";
		calendarElement.ariaLabel = Calendar._TT[this.showsTime ? "SEL_DATE_TIME" : "SEL_DATE"];
		calendarElement.setAttribute("aria-modal", true);
	}

	var calendarHeader = Calendar.createElement("div");
	Calendar.addClass(calendarHeader, "calendar-header");

	var title = Calendar.createElement("h2");
	title.id = "calendar-title";
	title.setAttribute("aria-live", "polite");
	Calendar.addClass(title, "row title");
	title.setAttribute("tabindex", -1);
	if (this.isPopup) {
		title.navtype = Calendar._TargetTypes.Title;
		title.ttip = Calendar._TT["DRAG_TO_MOVE"];
		title.style.cursor = "move";
		Calendar._assignMouseEvents(title, this, true);
	}
	this.title = title;
	calendarHeader.appendChild(this.title);

	var createButton = function (text, type, tooltipText) {
		var btn = Calendar.createElement("button");
		btn.navtype = type;
		btn.innerHTML = text;
		btn.ttip = tooltipText;
		btn.ariaLabel = tooltipText;
		Calendar._assignMouseEvents(btn, cal);
		return btn;
	};

	// Navigation
	var headerRow = Calendar.createElement("div");
	Calendar.addClass(headerRow, "row nav-row");

	this._nav_py = createButton("&#x00ab;", Calendar._TargetTypes.PrevYear, Calendar._TT["PREV_YEAR"]);
	Calendar.addClass(this._nav_py, "prev-year combobox-trigger");
	headerRow.appendChild(this._nav_py);

	this._nav_pm = createButton("&#x2039;", Calendar._TargetTypes.PrevMonth, Calendar._TT["PREV_MONTH"]);
	Calendar.addClass(this._nav_pm, "prev-month combobox-trigger");
	headerRow.appendChild(this._nav_pm);

	this._nav_now = createButton(Calendar._TT["TODAY"], Calendar._TargetTypes.GoToday, Calendar._TT["GO_TODAY"]);
	Calendar.addClass(this._nav_now, "go-today");
	headerRow.appendChild(this._nav_now);

	this._nav_nm = createButton("&#x203a;", Calendar._TargetTypes.NextMonth, Calendar._TT["NEXT_MONTH"]);
	Calendar.addClass(this._nav_nm, "next-month combobox-trigger");
	headerRow.appendChild(this._nav_nm);

	this._nav_ny = createButton("&#x00bb;", Calendar._TargetTypes.NextYear, Calendar._TT["NEXT_YEAR"]);
	Calendar.addClass(this._nav_ny, "next-year combobox-trigger");
	headerRow.appendChild(this._nav_ny);

	calendarHeader.appendChild(headerRow);
	this.element.appendChild(calendarHeader);

	// Dates table
	var table = Calendar.createElement("table");
	this.table = table;
	table.role = "grid";
	table.setAttribute("aria-labelledby", "calendar-title");
	table.cellSpacing = 0;
	table.cellPadding = 0;
	table.calendar = this;
	// Calendar.addEvent(table, "mousedown", Calendar.tableMouseDown);

	this.element.appendChild(table);

	var thead = Calendar.createElement("thead", table);
	thead.role = "rowgroup";
	var cell = null;
	var row = null;

	// weekday names
	row = Calendar.createElement("tr", thead);
	row.role = "row";
	Calendar.addClass(row, "daynames");
	if (this.weekNumbers) {
		cell = Calendar.createElement("th", row);
		Calendar.addClass(cell, "name wn");
		cell.innerHTML = Calendar._TT["WK"];
		cell.role = "columnheader";
		cell.ariaLabel = Calendar._TT["WEEK"];
	}
	for (var i = 7; i > 0; --i) {
		cell = Calendar.createElement("th", row);
		cell.role = "columnheader";
		cell.setAttribute("scope", "col");
		if (!i) {
			cell.navtype = Calendar._TargetTypes.Day;
			Calendar._assignMouseEvents(cell, this);
		}
	}
	this.firstdayname = this.weekNumbers ? row.firstChild.nextSibling : row.firstChild;
	this._displayWeekdays();

	var tbody = Calendar.createElement("tbody", table);
	tbody.role = "rowgroup";
	this.tbody = tbody;

	for (i = 6; i > 0; --i) {
		row = Calendar.createElement("tr", tbody);
		row.role = "row";
		if (this.weekNumbers) {
			cell = Calendar.createElement("th", row);
			cell.role = "rowheader";
			cell.setAttribute("scope", "row");
		}
		for (var j = 7; j > 0; --j) {
			cell = Calendar.createElement("td", row);
			Calendar._assignMouseEvents(cell, this);
		}
	}

	if (this.showsTime) {
		this._createTimeRow(this.element);
	} else {
		this.onSetTime = this.onUpdateTime = function () {};
	}

	div = Calendar.createElement("div", this.element);
	div.setAttribute("aria-hidden", true);
	Calendar.addClass(div, "ttip");
	div.innerHTML = Calendar._TT[this.showsTime ? "SEL_DATE_TIME" : "SEL_DATE"];
	if (this.isPopup) {
		div.navtype = Calendar._TargetTypes.Title;
		div.ttip = Calendar._TT["DRAG_TO_MOVE"];
		div.style.cursor = "move";
		Calendar._assignMouseEvents(div, this, true);
	}
	this.infoTextContainer = div;

	div = Calendar.createElement("div", this.element);
	this.monthsCombo = div;
	Calendar.addClass(div, "combo");
	for (i = 0; i < Calendar._MN.length; ++i) {
		var mn = Calendar.createElement("div");
		Calendar.addClass(mn, "label");
		mn.month = i;
		mn.innerHTML = Calendar._SMN[i];
		div.appendChild(mn);
	}

	div = Calendar.createElement("div", this.element);
	this.yearsCombo = div;
	Calendar.addClass(div, "combo");
	for (i = 12; i > 0; --i) {
		var yr = Calendar.createElement("div");
		Calendar.addClass(yr, "label");
		div.appendChild(yr);
	}

	div = Calendar.createElement("div", this.element);
	Calendar.addClass(div, "actions-row");

	var button = createButton(Calendar._TT["CONFIRM"], Calendar._TargetTypes.Confirm, Calendar._TT["CONFIRM"]);
	Calendar.addClass(button, "confirm");
	div.appendChild(button);

	button = createButton(Calendar._TT["CANCEL"], Calendar._TargetTypes.Cancel, Calendar._TT["CANCEL"]);
	Calendar.addClass(button, "cancel");
	div.appendChild(button);

	this._init(this.firstDayOfWeek, this.date);
	parent.appendChild(this.element);

	// JRADEV-11430 Prevent clicks on parts of the calendar that aren't already handled by
	// this lib from stealing focus from a focused element
	Calendar.addEvent(this.element, "mousedown", function (ev) {
		ev.preventDefault();
	});
};

Calendar.prototype._createTimeRow = function (parent) {
	var cal = this;
	var timeRow = Calendar.createElement("div", parent);
	Calendar.addClass(timeRow, "time-row");

	var div = Calendar.createElement("div", timeRow);
	div.innerHTML = Calendar._TT["TIME"] || "&nbsp;";

	var timeContainer = Calendar.createElement("div", timeRow);
	Calendar.addClass(timeContainer, "time");

	function makeTimePart(parent, ariaDescribedby, ariaLabel, className, init, range_start, range_end) {
		var part = Calendar.createElement("button", parent);
		Calendar.addClass(part, className);
		part.innerHTML = init;
		if (ariaLabel) {
			part.ariaLabel = ariaLabel;
		}
		part.setAttribute("aria-live", "assertive");
		part.setAttribute("aria-describedby", ariaDescribedby);
		part.calendar = cal;
		part.ttip = Calendar._TT["TIME_PART"];
		part._range = [];
		if (typeof range_start != "number") {
			part._range = range_start;
		} else {
			for (var i = range_start; i <= range_end; ++i) {
				var txt;
				if (i < 10 && range_end >= 10) {
					txt = "0" + i;
				} else {
					txt = "" + i;
				}
				part._range[part._range.length] = txt;
			}
		}
		Calendar._assignMouseEvents(part, cal);
		return part;
	}

	var hrs = cal.date.getHours();
	var mins = cal.date.getMinutes();
	var t12 = !cal.time24;
	var pm = hrs > 12;
	if (t12 && pm) {
		hrs -= 12;
	}
	var H = makeTimePart(
		timeContainer,
		"calendar-time-instructions",
		Calendar._TT["HOURS_FN"](hrs),
		"hour",
		hrs,
		t12 ? 1 : 0,
		t12 ? 12 : 23
	);
	H.navtype = Calendar._TargetTypes.Hours;
	H.ariaLabelGenerator = Calendar._TT["HOURS_FN"];

	var instructionsContainer = Calendar.createElement("p", timeContainer);
	instructionsContainer.id = "calendar-time-instructions";
	instructionsContainer.innerHTML = Calendar._TT["TIME_INSTRUCTIONS"];
	instructionsContainer.setAttribute("aria-hidden", true);
	Calendar.addClass(instructionsContainer, "assistive");

	var span = Calendar.createElement("span", timeContainer);
	span.innerHTML = ":";
	Calendar.addClass(span, "colon");

	var M = makeTimePart(
		timeContainer,
		"calendar-time-instructions",
		Calendar._TT["MINUTES_FN"](mins),
		"minute",
		mins,
		0,
		59
	);
	M.navtype = Calendar._TargetTypes.Minutes;
	M.ariaLabelGenerator = Calendar._TT["MINUTES_FN"];

	var AP = null;
	div = Calendar.createElement("div", timeRow);
	if (t12) {
		AP = makeTimePart(
			div,
			"calendar-am-pm-instructions",
			null,
			"ampm",
			pm ? Calendar._TT["PM"] : Calendar._TT["AM"],
			[Calendar._TT["am"],Calendar._TT["pm"]]
		);
		AP.navtype = Calendar._TargetTypes.AmPm;

		instructionsContainer = Calendar.createElement("p", div);
		instructionsContainer.id = "calendar-am-pm-instructions";
		instructionsContainer.innerHTML = Calendar._TT["TIME_AM_PM_INSTRUCTIONS"];
		instructionsContainer.setAttribute("aria-hidden", true);
		Calendar.addClass(instructionsContainer, "assistive");
	} else {
		div.innerHTML = "&nbsp;";
	}

	this.onSetTime = function () {
		var pm,
			hrs = this.date.getHours(),
			mins = this.date.getMinutes();
		if (t12) {
			pm = hrs >= 12;
			if (pm) {
				hrs -= 12;
			}
			if (hrs == 0) {
				hrs = 12;
			}
			AP.innerHTML = pm ? Calendar._TT["pm"] : Calendar._TT["am"];
		}
		H.innerHTML = hrs < 10 ? "0" + hrs : hrs;
		H.ariaLabel = Calendar._TT["HOURS_FN"](H.innerHTML);
		M.innerHTML = mins < 10 ? "0" + mins : mins;
		M.ariaLabel = Calendar._TT["MINUTES_FN"](M.innerHTML);
	};

	this.onUpdateTime = function () {
		var date = this.date;
		var h = parseInt(H.innerHTML, 10);
		if (t12) {
			if (new RegExp(Calendar._TT["pm"], "i").test(AP.innerHTML) && h < 12) {
				h += 12;
			} else if (new RegExp(Calendar._TT["am"], "i").test(AP.innerHTML) && h == 12) {
				h = 0;
			}
		}
		var d = date.getDate();
		var m = date.getMonth();
		var y = date.getFullYear();
		date.setHours(h);
		date.setMinutes(parseInt(M.innerHTML, 10));
		date.setFullYear(y);
		date.setMonth(m);
		date.setDate(d);
		this.dateClicked = false;
	};
};

Calendar._upkeyEvent = function (e) {
	// JRADEV-10921 - We need to make sure that the calendar is still visible when the
	// blur input field code runs (initKeyboardShortcuts.js) so that the LayerManager.js has the chance to preventDefault
	if (e.key !== "Escape") {
		return;
	}

	setTimeout(function () {
		e.stopPropagation();
		var cal = window._dynarch_popupCalendar;
		if (!cal || cal.multiple) {
			return;
		} else {
			cal.callCloseHandler();
		}
	});
};

/** keyboard navigation, only for popup calendars */
Calendar._keyEvent = function (ev) {
	if (ev.key === "Tab") {
		return;
	}

	var cal = window._dynarch_popupCalendar;
	if (!cal || cal.multiple) {
		return false;
	}

	var act = ev.type == "keydown";
	var K = ev.keyCode;
	switch (K) {
		case 32: // KEY space
		case 13: // KEY enter
			Calendar._handleClick(ev);
			break;
		case 37: // KEY left
		case 38: // KEY up
		case 39: // KEY right
		case 40: // KEY down
			if (!act) {
				return Calendar.stopEvent(ev);
			}

			var prev, x, y, ne, el, step;
			prev = K == 37 || K == 38;
			step = K == 37 || K == 39 ? 1 : 7;

			function setVars() {
				el = cal.currentDateEl;
				var p = el.pos;
				x = p & 15;
				y = p >> 4;
				ne = cal.ar_days[y][x];
			}
			setVars();

			function prevMonth() {
				var date = new Date(cal.date);
				date.setDate(date.getDate() - step);
				cal.setDate(date);
				Calendar._resetTabindex(cal, cal.currentDateEl);
				cal.currentDateEl.focus();
			}

			function nextMonth() {
				var date = new Date(cal.date);
				date.setDate(date.getDate() + step);
				cal.setDate(date);
				Calendar._resetTabindex(cal, cal.currentDateEl);
				cal.currentDateEl.focus();
			}

			while (1) {
				switch (K) {
					case 37: // KEY left
						if (--x >= 0) {
							ne = cal.ar_days[y][x];
						} else {
							x = 6;
							K = 38;
							continue;
						}
						break;
					case 38: // KEY up
						if (--y >= 0) {
							ne = cal.ar_days[y][x];
						} else {
							prevMonth();
							setVars();
						}
						break;
					case 39: // KEY right
						if (++x < 7) {
							ne = cal.ar_days[y][x];
						} else {
							x = 0;
							K = 40;
							continue;
						}
						break;
					case 40: // KEY down
						if (++y < cal.ar_days.length) {
							ne = cal.ar_days[y][x];
						} else {
							nextMonth();
							setVars();
						}
						break;
				}
				break;
			}

			if (ne) {
				if (!ne.disabled) {
					Calendar._handleClick({ target: ne });
				} else if (prev) {
					prevMonth();
				} else {
					nextMonth();
				}
			}
			break;
	}
	return Calendar.stopEvent(ev);
};

/**
 *  (RE)Initializes the calendar to the given date and firstDayOfWeek
 */
Calendar.prototype._init = function (firstDayOfWeek, seedDate) {
	// JRA-19533
	//
	// Depending on when the DST is applied, some hours might not exist. For example,
	// in Brazil, the clock goes like
	//    Saturday, 17 October 2014 23:59:58
	//    Saturday, 17 October 2014 23:59:59
	//     <------ DST starts here ------->
	//    Sunday, 18 October 2014 01:00:00
	//    Sunday, 18 October 2014 01:00:01
	//
	// We want to avoid iterating over times of dubious values.
	//
	// So first, we'll clone the original seed date.
	var date = new Date(seedDate);
	// Now, to avoid DST problems, we need to tweak the hour of day.
	//
	// Set time to 13.00 to avoid the case where a DST transition causes
	// the below method of iterating through dates to print the same
	// date twice consecutively.
	//
	// After checking the IANA time zone database (http://en.wikipedia.org/wiki/IANA_time_zone_database)
	// 13.00 was never used by any country to apply the DST, so it's a better assumption than midnight or
	// noon.
	date.setHours(13);

	var today = new Date(),
		TY = today.getFullYear(),
		TM = today.getMonth(),
		TD = today.getDate();
	this.table.style.visibility = "hidden";
	var year = date.getFullYear();
	if (year < this.minYear) {
		year = this.minYear;
		date.setFullYear(year);
	} else if (year > this.maxYear) {
		year = this.maxYear;
		date.setFullYear(year);
	}
	this.firstDayOfWeek = firstDayOfWeek;
	var month = date.getMonth();
	var mday = date.getDate();

	// calendar voodoo for computing the first day that would actually be
	// displayed in the calendar, even if it's from the previous month.
	// WARNING: this is magic. ;-)
	date.setDate(1);
	var day1 = (date.getDay() - this.firstDayOfWeek) % 7;
	if (day1 < 0) {
		day1 += 7;
	}
	date.setDate(-day1);
	date.setDate(date.getDate() + 1);

	var isPositiveTabIndexSet = false;
	var row = this.tbody.firstChild;
	var ar_days = (this.ar_days = new Array());
	var weekend = Calendar._TT["WEEKEND"];
	var dates = this.multiple ? (this.datesCells = {}) : null;
	for (var i = 0; i < 6; ++i, row = row.nextSibling) {
		var cell = row.firstChild;
		if (this.weekNumbers) {
			cell.className = "day wn";
			//
			// The old code didn't take into account the displayed month and hence
			// it showed 52/53 for the first week in January instead of 1
			// so we now taken this into account, but only for non ISO 8601 dates.
			//
			//cell.innerHTML = date.getWeekNumber();
			var monthStartDate = date;
			if (month == 0 && i == 0 && Date.useISO8601WeekNumbers == false) {
				// Jan and first week in row
				monthStartDate = new Date(year, month, 1);
			}
			cell.innerHTML = monthStartDate.getWeekNumber(this.firstDayOfWeek);
			cell.ariaLabel = Calendar._TT["WEEK_FN"](cell.innerHTML);
			cell = cell.nextSibling;
		}
		row.className = "daysrow";
		var hasdays = false,
			iday,
			dpos = (ar_days[i] = []);
		for (var j = 0; j < 7; ++j, cell = cell.nextSibling, date.setDate(iday + 1)) {
			iday = date.getDate();
			var wday = date.getDay();
			cell.className = "day day-" + iday;
			cell.pos = (i << 4) | j;
			dpos[j] = cell;
			var current_month = date.getMonth() == month;
			if (!current_month) {
				if (this.showsOtherMonths) {
					Calendar.addClass(cell, "othermonth");
					cell.otherMonth = true;
					cell.role = "gridcell";
					cell.setAttribute("aria-selected", false);
				} else {
					cell.className = "emptycell";
					cell.disabled = true;
					cell.removeAttribute("tabindex");
					cell.removeAttribute("role");
					cell.removeAttribute("aria-selected");
					cell.innerHTML = "";
					continue;
				}
			} else {
				cell.otherMonth = false;
				hasdays = true;
				cell.role = "gridcell";
				cell.setAttribute("aria-selected", false);
			}
			cell.disabled = false;
			cell.innerHTML = this.getDateText ? this.getDateText(date, iday) : iday;
			cell.setAttribute("tabindex", -1);
			if (!isPositiveTabIndexSet && !this.hiliteToday) {
				cell.setAttribute("tabindex", 0);
				isPositiveTabIndexSet = true;
			}
			if (dates) {
				dates[date.print("%Y%m%d")] = cell;
			}
			if (this.getDateStatus) {
				var status = this.getDateStatus(date, year, month, iday);
				if (this.getDateToolTip) {
					var toolTip = this.getDateToolTip(date, year, month, iday);
					if (toolTip) {
						cell.title = toolTip;
					}
				}
				if (status === true) {
					Calendar.addClass(cell, "disabled");
					cell.disabled = true;
				} else {
					if (/disabled/i.test(status)) {
						cell.disabled = true;
					}
					Calendar.addClass(cell, status);
				}
			}
			if (!cell.disabled) {
				cell.caldate = new Date(date);
				cell.ttip = "_";
				if (!this.multiple && current_month && iday == mday && this.hiliteToday) {
					Calendar.addClass(cell, "selected");
					cell.setAttribute("aria-selected", true);
					cell.setAttribute("tabindex", 0);
					isPositiveTabIndexSet = true;
					this.currentDateEl = cell;
				}
				if (date.getFullYear() == TY && date.getMonth() == TM && iday == TD) {
					Calendar.addClass(cell, "today");
					cell.ttip += Calendar._TT["PART_TODAY"];
				}
				if (weekend.indexOf(wday.toString()) != -1) {
					Calendar.addClass(cell, cell.otherMonth ? " oweekend" : " weekend");
				}
			}
		}
		if (!(hasdays || this.showsOtherMonths)) {
			row.className = "emptyrow";
		}
	}

	// JRA-19533
	// Now that we're done messing with the time of day, set the internal date to the seed date.
	this.date = new Date(seedDate);
	// The date above will include the original time, which will be used to set the time controls below.
	this.onSetTime();

	this.title.innerHTML = Calendar._MN[month] + ", " + year;
	this.table.style.visibility = "visible";
	this._initMultipleDates();
};

Calendar.prototype._initMultipleDates = function () {
	if (this.multiple) {
		for (var i in this.multiple) {
			var cell = this.datesCells[i];
			var d = this.multiple[i];
			if (!d) {
				continue;
			}
			if (cell) {
				Calendar.addClass(cell, "selected");
				cell.setAttribute("aria-selected", true);
				cell.setAttribute("tabindex", 0);
			}
		}
	}
};

Calendar.prototype._toggleMultipleDate = function (date) {
	if (this.multiple) {
		var ds = date.print("%Y%m%d");
		var cell = this.datesCells[ds];
		if (cell) {
			var d = this.multiple[ds];
			if (!d) {
				Calendar.addClass(cell, "selected");
				cell.setAttribute("aria-selected", true);
				cell.setAttribute("tabindex", 0);
				this.multiple[ds] = date;
			} else {
				Calendar.removeClass(cell, "selected");
				cell.setAttribute("aria-selected", false);
				cell.setAttribute("tabindex", -1);
				delete this.multiple[ds];
			}
		}
	}
};

/**
 *  Calls _init function above for going to a certain date (but only if the
 *  date is different than the currently selected one).
 */
Calendar.prototype.setDate = function (date) {
	if (!date.equalsTo(this.date)) {
		this._init(this.firstDayOfWeek, date);
	}
};

/**
 *  Refreshes the calendar.  Useful if the "disabledHandler" function is
 *  dynamic, meaning that the list of disabled date can change at runtime.
 *  Just * call this function if you think that the list of disabled dates
 *  should * change.
 */
Calendar.prototype.refresh = function () {
	this._init(this.firstDayOfWeek, this.date);
};

/** Modifies the "firstDayOfWeek" parameter (pass 0 for Synday, 1 for Monday, etc.). */
Calendar.prototype.setFirstDayOfWeek = function (firstDayOfWeek) {
	this._init(firstDayOfWeek, this.date);
	this._displayWeekdays();
};

/**
 *  Allows customization of what dates are enabled.  The "unaryFunction"
 *  parameter must be a function object that receives the date (as a JS Date
 *  object) and returns a boolean value.  If the returned value is true then
 *  the passed date will be marked as disabled.
 */
Calendar.prototype.setDateStatusHandler = Calendar.prototype.setDisabledHandler = function (unaryFunction) {
	this.getDateStatus = unaryFunction;
};

/** Customization of allowed year range for the calendar. */
Calendar.prototype.setRange = function (a, z) {
	this.minYear = a;
	this.maxYear = z;
};

/** Calls the first user handler (selectedHandler). */
Calendar.prototype.callHandler = function () {
	if (this.onSelected) {
		this.onSelected(this, this.date.print(this.dateFormat));
	}
	if (this.isPopup) {
		this.hide();
	}
};

/** Calls the second user handler (closeHandler). */
Calendar.prototype.callCloseHandler = function () {
	if (this.onClose) {
		this.onClose(this);
	}
};

/** Removes the calendar object from the DOM tree and destroys it. */
Calendar.prototype.destroy = function () {
	this.hide();
	jQuery(this.element).remove();
	Calendar._C = null;
	window._dynarch_popupCalendar = null;
};

/**
 *  Moves the calendar element to a different section in the DOM tree (changes
 *  its parent).
 */
Calendar.prototype.reparent = function (new_parent) {
	var el = this.element;
	el.parentNode.removeChild(el);
	new_parent.appendChild(el);
};

// This gets called when the user presses a mouse button anywhere in the
// document, if the calendar is shown.  If the click was outside the open
// calendar this function closes it.
Calendar._checkCalendar = function (ev) {
	var calendar = window._dynarch_popupCalendar;
	if (!calendar) {
		return false;
	}
	var el = Calendar.getTargetElement(ev);
	for (; el != null && el != calendar.element; el = el.parentNode);
	if (el == null) {
		// calls closeHandler which should hide the calendar.
		window._dynarch_popupCalendar.callCloseHandler();
		return Calendar.stopEvent(ev);
	}
};

/** Shows the calendar. */
Calendar.prototype.show = function () {
	if (this.params.inputField.disabled) {
		// Don't show the calendar if its inputField isn't editable.
		return;
	}
	Calendar.current = this;
	this.element.style.display = "block";
	Calendar.addClass(this.element, "active");

	this.hidden = false;
	if (this.isPopup) {
		window._dynarch_popupCalendar = this;
		Calendar.addEvent(document, "keyup", Calendar._upkeyEvent);
		Calendar.addEvent(document, "keydown", Calendar._keyEvent);
		Calendar.addEvent(document, "mousedown", Calendar._checkCalendar);
		this.focusHandler = Calendar._createFocusHandler(this.element);
		Calendar.addEvent(document, "keydown", this.focusHandler);
		if (this.currentDateEl) {
			this.currentDateEl.focus();
		} else {
			this.title.focus();
		}
	}
};

/**
 *  Hides the calendar.
 */
Calendar.prototype.hide = function () {
	if (this.isPopup) {
		Calendar.removeEvent(document, "keyup", Calendar._upkeyEvent);
		Calendar.removeEvent(document, "keydown", Calendar._keyEvent);
		Calendar.removeEvent(document, "mousedown", Calendar._checkCalendar);
		Calendar.removeEvent(document, "keydown", this.focusHandler);
	}

	Calendar.current = null;
	this.element.style.display = "none";
	Calendar.removeClass(this.element, "active");
	this.hidden = true;
	if (this.triggerEl) {
		this.triggerEl.focus();
	} else if (this.params.button) {
		this.params.button.focus();
	} else if (this.params.inputField) {
		this.params.inputField.focus();
	}
};

/**
 *  Shows the calendar at a given absolute position (beware that, depending on
 *  the calendar element style -- position property -- this might be relative
 *  to the parent's containing rectangle).
 */
Calendar.prototype.showAt = function (x, y) {
	var s = this.element.style;
	s.left = x + "px";
	s.top = y + "px";
	this.show();
};

/** Shows the calendar near a given element. */
Calendar.prototype.showAtElement = function (el, opts) {
	var self = this;
	var p = Calendar.getAbsolutePos(el);
	if (!opts || typeof opts != "string") {
		this.showAt(p.x, p.y + el.offsetHeight);
		return true;
	}
	function fixPosition(box) {
		if (box.x < 0) {
			box.x = 0;
		}
		if (box.y < 0) {
			box.y = 0;
		}
		var cp = document.createElement("div");
		var s = cp.style;
		s.position = "absolute";
		s.right = s.bottom = s.width = s.height = "0px";
		document.body.appendChild(cp);
		var br = Calendar.getAbsolutePos(cp);
		document.body.removeChild(cp);
		br.y += jQuery(window).scrollTop();
		br.x += jQuery(window).scrollLeft();
		var tmp = box.x + box.width - br.x;
		if (tmp > 0) {
			box.x -= tmp;
		}
		tmp = box.y + box.height - br.y;
		if (tmp > 0) {
			box.y -= tmp;
		}
	}
	this.element.style.display = "block";
	Calendar.continuation_for_the_khtml_browser = function () {
		var w = jQuery(self.element).outerWidth();
		var h = jQuery(self.element).outerHeight();
		self.element.style.display = "none";
		var valign = opts.substr(0, 1);
		var halign = "l";
		if (opts.length > 1) {
			halign = opts.substr(1, 1);
		}
		// vertical alignment
		switch (valign) {
			case "T":
				p.y -= h;
				break;
			case "B":
				p.y += jQuery(el).outerHeight();
				break;
			case "C":
				p.y += (jQuery(el).outerHeight() - h) / 2;
				break;
			case "t":
				p.y += jQuery(el).outerHeight() - h;
				break;
			case "b":
				break; // already there
		}
		// horizontal alignment
		switch (halign) {
			case "L":
				p.x -= w;
				break;
			case "R":
				p.x += jQuery(el).outerWidth();
				break;
			case "C":
				p.x += (jQuery(el).outerWidth() - w) / 2;
				break;
			case "l":
				p.x += jQuery(el).outerWidth() - w;
				break;
			case "r":
				break; // already there
		}
		p.width = w;
		p.height = h + 40;
		self.monthsCombo.style.display = "none";
		fixPosition(p);
		self.showAt(p.x, p.y);
	};
	Calendar.continuation_for_the_khtml_browser();
};

/** Customizes the date format. */
Calendar.prototype.setDateFormat = function (str) {
	this.dateFormat = str;
};

/** Customizes the tooltip date format. */
Calendar.prototype.setTtDateFormat = function (str) {
	this.ttDateFormat = str;
};

/**
 *  Tries to identify the date represented in a string.  If successful it also
 *  calls this.setDate which moves the calendar to the given date.
 */
Calendar.prototype.parseDate = function (str, fmt) {
	if (!fmt) {
		fmt = this.dateFormat;
	}
	this.setDate(Date.parseDate(str, fmt));
};

/** Internal function; it displays the bar with the names of the weekday. */
Calendar.prototype._displayWeekdays = function () {
	var fdow = this.firstDayOfWeek;
	var cell = this.firstdayname;
	var weekend = Calendar._TT["WEEKEND"];
	for (var i = 0; i < 7; ++i) {
		cell.className = "day name";
		var realday = (i + fdow) % 7;
		if (i) {
			cell.ttip = Calendar._TT["DAY_FIRST"].replace("%s", Calendar._DN[realday]);
			cell.navtype = Calendar._TargetTypes.WeekDayName;
			cell.fdow = realday;
			Calendar._assignMouseEvents(cell, this);
		}
		if (weekend.indexOf(realday.toString()) != -1) {
			Calendar.addClass(cell, "weekend");
		}
		cell.innerHTML = Calendar._SDN[(i + fdow) % 7];
		cell.ariaLabel = Calendar._DN[(i + fdow) % 7];
		cell = cell.nextSibling;
	}
};

/** Internal function.  Hides all combo boxes that might be displayed. */
Calendar.prototype._hideCombos = function () {
	this.monthsCombo.style.display = "none";
	this.yearsCombo.style.display = "none";
};

/** Internal function.  Starts dragging the element. */
Calendar.prototype._startDragging = function (ev) {
	if (this.dragging) {
		return;
	}

	this.dragging = true;
	var posX = ev.clientX + window.scrollX;
	var posY = ev.clientY + window.scrollY;
	var st = this.element.style;
	this.xOffs = posX - parseInt(st.left);
	this.yOffs = posY - parseInt(st.top);
	Calendar.addEvent(document, "mousemove", Calendar.drag);
	Calendar.addEvent(document, "mouseup", Calendar.endDragging);
};

// BEGIN: DATE OBJECT PATCHES

/** Adds the number of days array to the Date object. */
Date._MD = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);

/** Constants used for time computations */
Date.SECOND = 1000 /* milliseconds */;
Date.MINUTE = 60 * Date.SECOND;
Date.HOUR = 60 * Date.MINUTE;
Date.DAY = 24 * Date.HOUR;
Date.WEEK = 7 * Date.DAY;

/**
 * Splits based on multiple seprators as opposed to String.split, which takes only 1 separator
 */
Date._multisplit = function (s, seps) {
	if (s == null) {
		return null;
	}
	if (seps == null) {
		seps = "";
	}
	var arr = [];
	var len = s.length;
	var token = "";
	var inWord = false;
	for (i = 0; i < len; i++) {
		var c = s.charAt(i);
		if (seps.indexOf(c) == -1) {
			// it a non seperator
			inWord = true;
			token += c;
		} else {
			// its a separator
			if (inWord) {
				// finish of the last word first
				arr[arr.length] = token;
				token = "";
				inWord = false;
			}
			// ignore the sep character
		}
	}
	if (token.length > 0) {
		arr[arr.length] = token;
	}
	// in case the pass in a empty string to start with
	if (arr.length == 0) {
		arr[arr.length] = "";
	}
	return arr;
};

/**
 * This returns the characters in a string that are not part of the DHTML Calendar special
 * magic format characters, eg the ones that start with % something.
 */
Date._parseNonDateFormatChars = function (s) {
	//
	// as taken from code and documentation online
	// http://www.dynarch.com/demos/jscalendar/doc/html/reference.html#node_sec_5.3.6
	//
	var magicChars = "aAbBCdeHIJklmMnpPRSstUWVuwyY%";
	var nonMagicChars = "";
	var len = s.length;
	for (i = 0; i < len; i++) {
		var c = s.charAt(i);
		if (c == "%") {
			// peek ahead  and we always jump ahead too
			var peekc = "";
			if (i + 1 < len) {
				peekc = s.charAt(i + 1);
			}
			i = i + 1;
			if (peekc.length > 0 && magicChars.indexOf(peekc) != -1) {
				// we have a magic chars so eat it
				continue;
			} else {
				// we have a non magic chars preceded by a % (weird huh?) so put it in the list if its not there already
				if (nonMagicChars.indexOf(c) == -1) {
					nonMagicChars += c;
				}
				if (peekc.length > 0 && nonMagicChars.indexOf(peekc) == -1) {
					nonMagicChars += peekc;
				}
			}
		} else {
			// we have a non magic chars so put it in the list if its not there already
			if (nonMagicChars.indexOf(c) == -1) {
				nonMagicChars += c;
			}
		}
	}
	return nonMagicChars;
};

Date.splitDate = function (str, fmt) {
	var y = 0;
	var m = -1;
	var d = 0;
	// The old code used a regex /\W+/ that only worked for ISO Latin character sets
	// so we have replaced this with two new functions that parse out the non date format
	// characters and then splits the input value based on these non formatting characters.
	//
	var seps = Date._parseNonDateFormatChars(fmt);
	var a = Date._multisplit(str, seps);
	var b = fmt.match(/%./g);

	var i = 0,
		j = 0;
	var hr = 0;
	var min = 0;
	for (i = 0; i < a.length; ++i) {
		if (!a[i]) {
			continue;
		}
		switch (b[i]) {
			case "%d":
			case "%e":
				d = Number(a[i]);
				break;

			case "%m":
				m = Number(a[i]) - 1;
				break;

			case "%Y":
			case "%y":
				y = Number(a[i]);
				y < 100 && (y += y > 29 ? 1900 : 2000);
				break;

			case "%b":
			case "%B":
				var monthName = a[i].toLowerCase();
				var found = false;
				if (b[i] == "%b") {
					for (j = 0; j < 12; ++j) {
						// check most specific first
						if (Calendar._SMN[j].substr(0, monthName.length).toLowerCase() == monthName) {
							m = j;
							found = true;
							break;
						}
					}
				}
				if (!found) {
					// do it the old code way even for %b if need be
					for (j = 0; j < 12; ++j) {
						if (Calendar._MN[j].substr(0, monthName.length).toLowerCase() == monthName) {
							m = j;
							break;
						}
					}
				}
				break;

			case "%H":
			case "%I":
			case "%k":
			case "%l":
				hr = Number(a[i]);
				break;

			case "%P":
			case "%p":
				if (/pm/i.test(a[i]) && hr < 12) {
					hr += 12;
				} else if (/am/i.test(a[i]) && hr >= 12) {
					hr -= 12;
				}
				break;

			case "%M":
				min = Number(a[i]);
				break;

			case "%R":
				var hrMinString = a[i];
				var hrMinSeparator = hrMinString.indexOf(":");
				var hrString = hrMinString.substring(0, hrMinSeparator);
				var minString = hrMinSeparator == -1 ? 0 : hrMinString.substring(hrMinSeparator + 1);

				hr = Number(hrString);
				min = Number(minString);
				break;
		}
	}

	return { parts: a, year: y, month: m, day: d, hour: hr, minute: min };
};

Date.parseDate = function (str, fmt) {
	var today = new Date();
	var parts = Date.splitDate(str, fmt);

	var a = parts.parts;
	var y = parts.year;
	var m = parts.month;
	var d = parts.day;
	var hr = parts.hour;
	var min = parts.minute;
	var i = 0,
		j = 0;

	if (isNaN(y)) {
		y = today.getFullYear();
	}
	if (isNaN(m)) {
		m = today.getMonth();
	}
	if (isNaN(d)) {
		d = today.getDate();
	}
	if (isNaN(hr)) {
		hr = today.getHours();
	}
	if (isNaN(min)) {
		min = today.getMinutes();
	}

	if (y != 0 && m != -1 && d != 0) {
		return new Date(y, m, d, hr, min, 0);
	}
	y = 0;
	m = -1;
	d = 0;
	for (i = 0; i < a.length; ++i) {
		if (a[i].search(/[a-zA-Z]+/) != -1) {
			var t = -1;
			for (j = 0; j < 12; ++j) {
				if (Calendar._MN[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) {
					t = j;
					break;
				}
			}
			if (t != -1) {
				if (m != -1) {
					d = m + 1;
				}
				m = t;
			}
		} else if (Number(a[i]) <= 12 && m == -1) {
			m = a[i] - 1;
		} else if (Number(a[i]) > 31 && y == 0) {
			y = Number(a[i]);
			y < 100 && (y += y > 29 ? 1900 : 2000);
		} else if (d == 0) {
			d = a[i];
		}
	}
	if (y == 0) {
		y = today.getFullYear();
	}
	if (m != -1 && d != 0) {
		return new Date(y, m, d, hr, min, 0);
	}
	return today;
};

/** Returns the number of days in the current month */
Date.prototype.getMonthDays = function (month) {
	var year = this.getFullYear();
	if (typeof month == "undefined") {
		month = this.getMonth();
	}
	if (0 == year % 4 && (0 != year % 100 || 0 == year % 400) && month == 1) {
		return 29;
	} else {
		return Date._MD[month];
	}
};

/** Returns the number of day in the year. */
Date.prototype.getDayOfYear = function () {
	// JRA-19533 -- We use an hour of 13 to avoid potential DST problems.
	var now = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 13, 0, 0);
	var then = new Date(this.getFullYear(), 0, 0, 13, 0, 0);
	var time = now - then;
	return Math.floor(time / Date.DAY);
};

/** Returns the number of the week in year, as defined in ISO 8601. */
Date.prototype.getWeekNumber = function (startOfWeek) {
	if (Date.useISO8601WeekNumbers) {
		return this.getISO8601WeekNumber();
	} else {
		return this.getSimpleWeekNumber(startOfWeek);
	}
};

/* Algorithm taken from: http://www.staff.science.uu.nl/~gent0113/calendar/isocalendar.htm
 */
Date.prototype.getISO8601WeekNumber = function () {
	function gregdaynumber(year, month, day) {
		// computes the day number since 0 January 0 CE (Gregorian)

		y = year;
		m = month;
		if (month < 3) {
			y = y - 1;
		}
		if (month < 3) {
			m = m + 12;
		}
		return Math.floor(365.25 * y) - Math.floor(y / 100) + Math.floor(y / 400) + Math.floor(30.6 * (m + 1)) + day - 62;
	}

	function isocalendar1(date) {
		// computes the ISO calendar date from the current Gregorian date
		year = date.getFullYear();
		month = date.getMonth(); // 0=January, 1=February, etc.
		day = date.getDate();
		wday = date.getDay();

		weekday = ((wday + 6) % 7) + 1; // weekdays will be numbered 1 to 7

		isoyear = year;

		d0 = gregdaynumber(year, 1, 0);
		weekday0 = ((d0 + 4) % 7) + 1;

		d = gregdaynumber(year, month + 1, day);
		isoweeknr = Math.floor((d - d0 + weekday0 + 6) / 7) - Math.floor((weekday0 + 3) / 7);

		// check whether the last few days of December belong to the next year's ISO week

		if (month == 11 && day - weekday > 27) {
			isoweeknr = 1;
			isoyear = isoyear + 1;
		}

		// check whether the first few days of January belong to the previous year's ISO week
		if (month == 0 && weekday - day > 3) {
			d0 = gregdaynumber(year - 1, 1, 0);
			weekday0 = ((d0 + 4) % 7) + 1;
			isoweeknr = Math.floor((d - d0 + weekday0 + 6) / 7) - Math.floor((weekday0 + 3) / 7);
			isoyear = isoyear - 1;
		}

		return isoweeknr;
	}

	return isocalendar1(this);
};

/* Algorithm taken from: http://www.merlyn.demon.co.uk/weekcalc.htm#NIP
   Blame them for the shit variable and function names. Seriously, WTF?
   This is "Type 1" with a Sun-Sat row.

   Using the simple week counting you need to know
   the start of week so you can do the calculations properly.

   If you don't specify a startOfWeek then Sunday is used.
*/

Date.prototype.getSimpleWeekNumber = function (startOfWeek) {
	function OddWkNo1(D, d1, d2) {
		var Yr = D.getFullYear(),
			Jan1 = new Date(Yr, 0, 1),
			Q;
		Q = Math.round((D - Jan1) / 86400000);
		if (d1 != null) {
			Q -= (7 + d1 - Jan1.getDay()) % 7;
		}
		if (d2 != null) {
			Q += d2;
		}
		return [Yr, (1 + Q / 7) | 0, 1 + ((7 + Q) % 7)];
	}

	return OddWkNo1(this, startOfWeek ? startOfWeek : 6, 6)[1];
	//    return OddWkNo1(this, 6, 6)[1];
};

/** Checks date and time equality */
Date.prototype.equalsTo = function (date) {
	return (
		this.getFullYear() == date.getFullYear() &&
		this.getMonth() == date.getMonth() &&
		this.getDate() == date.getDate() &&
		this.getHours() == date.getHours() &&
		this.getMinutes() == date.getMinutes()
	);
};

/** Set only the year, month, date parts (keep existing time) */
Date.prototype.setDateOnly = function (date) {
	var tmp = new Date(date);
	this.setDate(1);
	this.setFullYear(tmp.getFullYear());
	this.setMonth(tmp.getMonth());
	this.setDate(tmp.getDate());
};

/** Prints the date in a string according to the given format. */
Date.prototype.print = function (str) {
	var m = this.getMonth();
	var d = this.getDate();
	var y = this.getFullYear();
	var wn = this.getWeekNumber();
	var w = this.getDay();
	var s = {};
	var hr = this.getHours();
	var pm = hr >= 12;
	var ir = pm ? hr - 12 : hr;
	var dy = this.getDayOfYear();
	if (ir == 0) {
		ir = 12;
	}
	var min = this.getMinutes();
	var sec = this.getSeconds();
	s["%a"] = Calendar._SDN[w]; // abbreviated weekday name [FIXME: I18N]
	s["%A"] = Calendar._DN[w]; // full weekday name
	s["%b"] = Calendar._SMN[m]; // abbreviated month name [FIXME: I18N]

	s["%B"] = Calendar._MN[m]; // full month name
	// FIXME: %c : preferred date and time representation for the current locale
	s["%C"] = 1 + Math.floor(y / 100); // the century number
	s["%d"] = d < 10 ? "0" + d : d; // the day of the month (range 01 to 31)
	s["%e"] = d; // the day of the month (range 1 to 31)
	// FIXME: %D : american date style: %m/%d/%y
	// FIXME: %E, %F, %G, %g, %h (man strftime)
	s["%H"] = hr < 10 ? "0" + hr : hr; // hour, range 00 to 23 (24h format)
	s["%I"] = ir < 10 ? "0" + ir : ir; // hour, range 01 to 12 (12h format)
	s["%j"] = dy < 100 ? (dy < 10 ? "00" + dy : "0" + dy) : dy; // day of the year (range 001 to 366)
	s["%k"] = hr; // hour, range 0 to 23 (24h format)
	s["%l"] = ir; // hour, range 1 to 12 (12h format)
	s["%m"] = m < 9 ? "0" + (1 + m) : 1 + m; // month, range 01 to 12
	s["%M"] = min < 10 ? "0" + min : min; // minute, range 00 to 59
	s["%n"] = "\n"; // a newline character
	s["%p"] = pm ? Calendar._TT["PM"] : Calendar._TT["AM"];
	s["%P"] = pm ? Calendar._TT["PM"] : Calendar._TT["AM"];
	// FIXME: %r : the time in am/pm notation %I:%M:%S %p
	// FIXME: %R : the time in 24-hour notation %H:%M
	s["%R"] = s["%k"] + ":" + s["%M"];

	s["%s"] = Math.floor(this.getTime() / 1000);
	s["%S"] = sec < 10 ? "0" + sec : sec; // seconds, range 00 to 59
	s["%t"] = "\t"; // a tab character
	// FIXME: %T : the time in 24-hour notation (%H:%M:%S)
	s["%U"] = s["%W"] = s["%V"] = wn < 10 ? "0" + wn : wn;
	s["%u"] = w + 1; // the day of the week (range 1 to 7, 1 = MON)
	s["%w"] = w; // the day of the week (range 0 to 6, 0 = SUN)
	// FIXME: %x : preferred date representation for the current locale without the time
	// FIXME: %X : preferred time representation for the current locale without the date
	s["%y"] = ("" + y).slice(-2); // year without the century (range 00 to 99)
	s["%Y"] = y; // year with the century
	s["%%"] = "%"; // a literal '%' character

	var re = /%./g;
	return str.replace(re, function (par) {
		return s[par] || par;
	});
};

/*
 * Jira incorporated the DHTML Calendar library ~2005
 * This particular library came with couple of native JS Objects' extensions, for - gods only know - what reasons...
 *
 * For instance - this particular piece of ancient magic is - most probably - expected to assert that shifting year
 * on a date object which is set to represent the very last day of February in a leap year
 * will result in a date object representing the very last possible day of February in the newly set year.
 * Think of: Date(2016-02-29).setFullYear(2018) will give you 2018-02-28 instead of (proper) 2018-03-01
 * As there seem to be no original documentation left - we can only speculate this is the intended behaviour based on
 * the code base left by the ancient ones...
 *
 * As this modifies the actual JS Date object AND is part of Jira code base since 2005 we can not realistically measure
 * the dependency on this implementation in our ecosystem and thus - have to consider this as part of frontend API...
 *
 * The way it was originally implemented was totally bonkers as it assumed (wrongly) that the Date.setFullYear may
 * only accept one parameter...
 *
 * This made the whole ecosystem try to "work around the problem"... as of 2019-01-30 we have fixed
 * the buggy implementation whilst still leaving the (doubtful) change in behaviour of the method.
 *
 * @deprecated This behaviour is considered as DEPRECATED since Jira 8.0 and will be removed with Jira 9.0 release.
 **/
Date.prototype.__msh_oldSetFullYear = Date.prototype.setFullYear;
/*
 * @deprecated This custom overwrite that introduced non-standard behaviour is considered as DEPRECATED
 * since Jira 8.0 and will be reverted to native implementation with Jira 9.0 release.
 **/
Date.prototype.setFullYear = function () {
	var d = new Date(this);
	d.__msh_oldSetFullYear.apply(this, arguments);
	if (d.getMonth() != this.getMonth()) {
		this.setDate(28);
	}
	this.__msh_oldSetFullYear.apply(this, arguments);
};

// END: DATE OBJECT PATCHES

// global object that remembers the calendar
window._dynarch_popupCalendar = null;
