/*  Copyright Mihai Bazon, 2002, 2003  |  http://dynarch.com/mishoo/
 * ---------------------------------------------------------------------------
 *
 * The DHTML Calendar
 *
 * Details and latest version at:
 * http://dynarch.com/mishoo/calendar.epl
 *
 * This script is distributed under the GNU Lesser General Public License.
 * Read the entire license text here: http://www.gnu.org/licenses/lgpl.html
 *
 * This file defines helper functions for setting up the calendar.  They are
 * intended to help non-programmers get a working calendar on their site
 * quickly.  This script should not be seen as part of the calendar.  It just
 * shows you what one can do with the calendar, while in the same time
 * providing a quick and simple method for setting it up.  If you need
 * exhaustive customization of the calendar creation process feel free to
 * modify this code to suit your needs (this is recommended and much better
 * than modifying calendar.js itself).
 */

// $Id: calendar-setup.js,v 1.1 2005/04/26 03:29:58 mchai Exp $

// Scope usage of jQuery and logging functions for implementation of the Calendar setup function.
/* eslint-disable */
(function (jQuery, logger, formatter) {
	/**
	 *  This function "patches" an input field (or other element) to use a calendar
	 *  widget for date selection.
	 *
	 *  The "params" is a single object that can have the following properties:
	 *
	 *    prop. name   | description
	 *  -------------------------------------------------------------------------------------------------
	 *   inputField    | the ID of an input field to store the date
	 *   displayArea   | the ID of a DIV or other element to show the date
	 *   button        | ID of a button or other element that will trigger the calendar
	 *   eventName     | event that will trigger the calendar, without the "on" prefix (default: "click")
	 *   ifFormat      | date format that will be stored in the input field
	 *   daFormat      | the date format that will be used to display the date in displayArea
	 *   firstDay      | numeric: 0 to 6.  "0" means display Sunday first, "1" means display Monday first, etc.
	 *   align         | alignment (default: "Br"); if you don't know what's this see the calendar documentation
	 *   range         | array with 2 elements.  Default: [1900, 2999] -- the range of years available
	 *   weekNumbers   | (true/false) if it's true (default) the calendar will display week numbers
	 *   flat          | null or element ID; if not null the calendar will be a flat calendar having the parent with the given ID
	 *   flatCallback  | function that receives a JS Date object and returns an URL to point the browser to (for flat calendar)
	 *   disableFunc   | function that receives a JS Date object and should return true if that date has to be disabled in the calendar
	 *   onSelect      | function that gets called when a date is selected.  You don't _have_ to supply this (the default is generally okay)
	 *   onClose       | function that gets called when the calendar is closed.  [default]
	 *   onUpdate      | function that gets called after the date is updated in the input field.  Receives a reference to the calendar.
	 *   date          | the date that the calendar will be initially displayed to
	 *   todayDate     | the date-time that the calendar will user with the Today button
	 *   showsTime     | default: false; if true the calendar will include a time selector
	 *   timeFormat    | the time format; can be "12" or "24", default is "12"
	 *   step          | configures the step of the years in drop-down boxes; default: 2
	 *   position      | configures the calendar absolute position; default: null
	 *   cache         | if "true" (but default: "false") it will reuse the same calendar object, where possible
	 *   showOthers    | if "true" (but default: "false") it will show days from other months too
	 *
	 *  None of them is required, they all have default values.  However, if you
	 *  pass none of "inputField", "displayArea" or "button" you'll get a warning
	 *  saying "nothing to setup".
	 */
	Calendar.setup = function (params) {
		params = params || {};

		function param_default(pname, def) {
			if (typeof params[pname] == "undefined") {
				params[pname] = def;
			}
		}

		param_default("inputField", null);
		param_default("context", null);
		param_default("displayArea", null);
		param_default("button", null);
		param_default("eventName", "click");
		param_default("ifFormat", "%Y/%m/%d");
		param_default("daFormat", "%Y/%m/%d");
		param_default("disableFunc", null);
		param_default("dateStatusFunc", params["disableFunc"]); // takes precedence if both are defined
		param_default("dateText", null);
		param_default("firstDay", null);
		param_default("align", "Br");
		param_default("range", [1900, 2999]);
		param_default("weekNumbers", true);
		/*
     Set this to true if you want to use the ISO 8601 week numbering scheme.  This was the old default.
     But is now the week contain Jan 01 is considered the first week of the year after many customer requests
     so we now useISO8601WeekNumbers is false by default. 
    */
		param_default("useISO8601WeekNumbers", false);

		param_default("flat", null);
		param_default("flatCallback", null);
		param_default("onSelect", null);
		param_default("onClose", null);
		param_default("onUpdate", null);
		param_default("date", null);
		param_default("todayDate", null);
		param_default("showsTime", false);
		param_default("timeFormat", "24");
		param_default("step", 1);
		param_default("position", null);
		param_default("cache", false);
		param_default("showOthers", false);
		param_default("multiple", null);

		// Required for some tests to pass
		if (!Calendar._TT) {
			Calendar._TT = {};
		}

		// Setup additional i18n strings
		Calendar._TT["SEL_DATE"] = formatter.I18n.getText("date.picker.select.date");
		Calendar._TT["SEL_DATE_TIME"] = formatter.I18n.getText("date.picker.select.date.n.time");
		Calendar._TT["WEEK"] = formatter.I18n.getText("date.picker.week.label");
		Calendar._TT["WEEK_FN"] = function (value) {
			return formatter.I18n.getText("date.picker.week.number.label", value);
		};
		Calendar._TT["PREV_YEAR"] = formatter.I18n.getText("date.picker.go.to.previous.year");
		Calendar._TT["PREV_MONTH"] = formatter.I18n.getText("date.picker.go.to.previous.month");
		Calendar._TT["NEXT_MONTH"] = formatter.I18n.getText("date.picker.go.to.next.month");
		Calendar._TT["NEXT_YEAR"] = formatter.I18n.getText("date.picker.go.to.next.year");
		Calendar._TT["HOURS_FN"] = function (value) {
			return formatter.I18n.getText("date.picker.time.hours.label", Number.parseInt(value));
		};
		Calendar._TT["MINUTES_FN"] = function (value) {
			return formatter.I18n.getText("date.picker.time.minutes.label", Number.parseInt(value));
		};
		Calendar._TT["TIME_INSTRUCTIONS"] = formatter.I18n.getText("date.picker.time.button.instructions");
		Calendar._TT["TIME_AM_PM_INSTRUCTIONS"] = formatter.I18n.getText("date.picker.time.ampm.button.instructions");
		Calendar._TT["CONFIRM"] = formatter.I18n.getText("date.picker.confirm.selection");
		Calendar._TT["CANCEL"] = formatter.I18n.getText("common.words.cancel");

		var i, item;

		// Unwrap jQuery and deal with the base Element.
		var unwrap = ["context", "inputField", "button", "displayArea"];
		for (i in unwrap) {
			item = unwrap[i];
			if (params[item] instanceof jQuery) {
				params[item] = params[item][0];
			}
		}

		var tmp = ["inputField", "displayArea", "button"];
		for (i in tmp) {
			item = tmp[i];
			if (typeof params[item] === "string") {
				/**
				 * TODO JDEV-27991: Kill this ID string. The API of Calendar#setup should NOT accept an ID of an element, it should take the element itself.
				 * Then there'd be no need to search within a context and do all this stupid stuff.
				 */
				var escapedSelector = "#" + jQuery.escapeSelector(params[item]);
				var el = jQuery(params.context || document.body).find(escapedSelector);
				params[item] = el[0];
			}
		}

		if (!(params.flat || params.multiple || params.inputField || params.displayArea || params.button)) {
			logger.log("Calendar.setup:\n  Nothing to setup (no fields found).  Please check your code");
			return false;
		}

		if (params.firstDay && params.firstDay !== null) {
			params.firstDay = +params.firstDay; // Convert firstDay from a string to a number
		}

		function onSelect(cal) {
			var p = cal.params;
			if (p.inputField) {
				p.inputField.value = cal.date.print(p.ifFormat);
				jQuery(p.inputField).change();
			}
			if (p.displayArea) {
				p.displayArea.innerHTML = cal.date.print(p.daFormat);
			}
			if (typeof p.onUpdate == "function") {
				p.onUpdate(cal);
			}
			if (p.flat && typeof p.flatCallback == "function") {
				p.flatCallback(cal);
			}
			if (cal.dateClicked || p.singleClick) {
				cal.callCloseHandler();
			}
		}

		if (params.flat != null) {
			if (typeof params.flat == "string") {
				params.flat = document.getElementById(params.flat);
			}
			if (!params.flat) {
				logger.log("Calendar.setup:\n  Flat specified but can't find parent.");
				return false;
			}
			var cal = new Calendar(params.firstDay, params.date, params.todayDate, params.onSelect || onSelect);
			cal.showsOtherMonths = params.showOthers;
			cal.showsTime = params.showsTime;
			cal.time24 = params.timeFormat == "24";
			cal.params = params;
			cal.weekNumbers = params.weekNumbers;
			cal.setRange(params.range[0], params.range[1]);
			cal.setDateStatusHandler(params.dateStatusFunc);
			cal.getDateText = params.dateText;
			if (params.ifFormat) {
				cal.setDateFormat(params.ifFormat);
			}
			if (params.inputField && typeof params.inputField.value == "string") {
				cal.parseDate(params.inputField.value);
			}
			cal.create(params.flat);
			cal.show();
			return false;
		}

		var triggerEl = params.button || params.displayArea || params.inputField;

		jQuery(triggerEl).bind(params.eventName, function (e) {
			e.preventDefault();
			createCalendar();
		});

		if (params.inputField) {
			enhanceInputField();
		}

		function createCalendar(triggerElement) {
			if (Calendar._UNSUPPORTED === true) {
				/* [alert] */
				alert("The JIRA Calendar does not currently support your language.");
				/* [alert] end */
				return;
			}
			var dateEl = params.inputField || params.displayArea;
			var dateFmt = params.inputField ? params.ifFormat : params.daFormat;
			var mustCreate = false;
			var cal = window.calendar;
			if (cal) {
				cal.hide();
			}

			if (dateEl && (dateEl.value || dateEl.innerHTML)) {
				params.date = Date.parseDate(dateEl.value || dateEl.innerHTML, dateFmt);
			}

			if (!(cal && params.cache)) {
				window.calendar = cal = new Calendar(
					params.firstDay,
					params.date,
					params.todayDate,
					params.onSelect || onSelect,
					params.onClose ||
						function (cal) {
							cal.hide();
						}
				);
				cal.showsTime = params.showsTime;
				cal.time24 = params.timeFormat == "24";
				cal.weekNumbers = params.weekNumbers;
				// BB - At the Date object level not Calendar
				Date.useISO8601WeekNumbers = params.useISO8601WeekNumbers;
				if (params.useISO8601WeekNumbers) {
					// ISO8601 assumes that first day of week is Monday
					cal.firstDayOfWeek = 1;
				}
				mustCreate = true;
			} else {
				if (params.date) {
					cal.setDate(params.date);
				}
				cal.hide();
			}
			if (params.multiple) {
				cal.multiple = {};
				for (var i = params.multiple.length; --i >= 0; ) {
					var d = params.multiple[i];
					var ds = d.print("%Y%m%d");
					cal.multiple[ds] = d;
				}
			}
			cal.showsOtherMonths = params.showOthers;
			cal.yearStep = params.step;
			cal.setRange(params.range[0], params.range[1]);
			cal.params = params;
			cal.setDateStatusHandler(params.dateStatusFunc);
			cal.getDateText = params.dateText;
			cal.setDateFormat(dateFmt);
			if (mustCreate) {
				cal.create();
			}
			cal.refresh();
			if (triggerElement) {
				cal.triggerEl = triggerElement;
			} else {
				cal.triggerEl = null;
			}
			if (!params.position) {
				cal.showAtElement(params.button || params.displayArea || params.inputField, params.align);
			} else {
				cal.showAt(params.position[0], params.position[1]);
			}
			return false;
		}

		// UX enhancements for when the calendar is used in conjunction with an input
		function enhanceInputField() {
			var $inputField = jQuery(params.inputField);

			// Prevent interactions with the calendar from blurring input.
			// Since the calendar already prevents default on mousedown inside the calendar popup,
			// this only needs to be done for the trigger button.
			if (params.button) {
				jQuery(params.button).mousedown(function (e) {
					e.preventDefault();
				});
			}

			$inputField.keydown(function (e) {
				var cal = window.calendar;

				if (e.key === "ArrowDown" && (!cal || cal.hidden)) {
					// setTimeout is needed so that pressing the down arrow doesn't create the calendar AND cause the date to jump by a week
					setTimeout(function () {
						createCalendar($inputField);
					}, 1);
				}
			});
		}

		return cal;
	};
})(require("jquery"), require("jira/util/logger"), require("jira/util/formatter"));
/* eslint-enable */
