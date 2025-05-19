define("jira/multipicker/multipickerutils", [], function () {
    'use strict';

    function rowHover(row) {
        row.oldClassName = row.className;
        row.className = 'rowHover';
        row.onmouseout = function () {
            this.className = this.oldClassName;
        };
    }

    function setCheckboxes() {
        var value = document.selectorform.all.checked;
        var numelements = document.selectorform.elements.length;
        var item;
        for (var i = 0; i < numelements; i++) {
            item = document.selectorform.elements[i];
            item.checked = value;
        }
    }

    function selectSingleGroup(event) {
        event.preventDefault();

        var checkedInput = document.querySelector('input[name=userchecks]:checked');
        if (!checkedInput) {
            return window.close();
        }

        var customFieldId = document.getElementById("openElement").textContent.trim();
        var openerCustomFieldElem = opener.document.getElementById(customFieldId);
        openerCustomFieldElem.value = checkedInput.value;
        window.close();
    }

    function selectSingleUser(event) {
        event.preventDefault();

        var checkedInput = document.querySelector('input[name=userchecks]:checked');
        if (!checkedInput) {
            return window.close();
        }

        var triggerEventName = document.getElementById("triggerEvent").textContent.trim();
        var customFieldId = document.getElementById("openElement").textContent.trim();
        var $openerCustomFieldElem = opener.jQuery('#' + customFieldId);

        $openerCustomFieldElem.val(checkedInput.value);
        if (triggerEventName) {
            $openerCustomFieldElem.trigger(triggerEventName, checkedInput.value);
        }

        window.close();
    }

    function setRadio(id) {
        var radioElem = document.getElementById(id);
        if (!radioElem) {
            return;
        }
        radioElem.checked = true;
    }

    function addItemsToInputField(inputSelector) {
        var openerElId = document.getElementById("openElement").textContent.trim();
        var openerEl = opener.document.getElementById(openerElId);
        var selectedUsersString = createPreviouslySelectedString(AJS.$('input[name="previouslySelected"]').val(), inputSelector);
        selectedUsersString = selectedUsersString.substring(1, selectedUsersString.length - 1);
        var selectedUsers = selectedUsersString.split(";");

        for (var x in selectedUsers) {
            if (selectedUsers.hasOwnProperty(x)) {
                addSingleUserToText(decodeUserName(selectedUsers[x]), openerEl);
            }
        }

        var userList = [];
        AJS.$.each(openerEl.value.split(","), function () {
            var username = trim(this);
            if (username && username !== "") {
                userList.push(username);
            }
        });
        userList.sort();
        openerEl.value = userList.join(", ");
        window.close();
    }

    function selectMultiUser(event) {
        event.preventDefault();
        var checkboxes = document.querySelectorAll('input[name=userchecks]:checked');
        var selectedValues = [];
        checkboxes.forEach(function (checkbox) {
            selectedValues.push({
                id: checkbox.value,
                displayName: checkbox.getAttribute('data-display-name')
            });
        });

        if (selectedValues.length === 0) {
            return window.close();
        }

        var triggerEventName = document.getElementById("triggerEvent").textContent.trim();
        if (triggerEventName) {
            var customFieldId = document.getElementById("openElement").textContent.trim();
            var $openerCustomFieldElem = opener.jQuery('#' + customFieldId);
            $openerCustomFieldElem.trigger(triggerEventName, JSON.stringify(selectedValues));
            window.close();
        } else {
            addItemsToInputField('input[data-user-select]');
        }
    }

    function addSingleUserToText(user, openerEl) {
        var userList = openerEl.value.split(",");
        for (var i = 0; i < userList.length; i++) {
            if (user === trim(userList[i])) {
                return;
            }
        }
        if (openerEl.value === "") {
            openerEl.value = user;
        } else {
            openerEl.value = openerEl.value + ", " + user;
        }
    }

    function trim(str) {
        return str.replace(/^\s*|\s*$/g, "");
    }

    // Multi-Select - Shift Click
    var recordedCheckBoxIndex;

    function processCBClick(myEvent, myCheckBox) {
        if (myCheckBox.checked) {
            if (myEvent.shiftKey) {
                selectMultiple(myCheckBox);
            } else {
                recordCheckBox(myCheckBox);
                // setRowClass(findCheckBox(myCheckBox), true);
            }
        } else {
            recordedCheckBoxIndex = null;
            // setRowClass(findCheckBox(myCheckBox), false);
        }
    }

    function recordCheckBox(checkBoxToRecord) {
        recordedCheckBoxIndex = findCheckBox(checkBoxToRecord);
    }

    function selectMultiple(myCheckBox) {
        if (recordedCheckBoxIndex == null) {
            return;
        }

        var currentCheckBox = findCheckBox(myCheckBox);

        var lastSelected = selectNeededCheckBoxes(myCheckBox, Math.min(currentCheckBox, recordedCheckBoxIndex), Math.max(currentCheckBox, recordedCheckBoxIndex), true);

        recordedCheckBoxIndex = lastSelected;
    }

    function findCheckBox(myCheckBox) {
        for (var i = 0; i < myCheckBox.form.elements[myCheckBox.name].length; i++) {
            if (myCheckBox.form.elements[myCheckBox.name][i].value === myCheckBox.value) {
                return i;
            }
        }
    }

    function selectNeededCheckBoxes(myCheckBox, from, to, value) {
        var j;
        for (j = from; j <= to; j++) {
            myCheckBox.form.elements[myCheckBox.name][j].checked = value;
            //setRowClass(j, value);
        }

        return j;
    }

    // eslint-disable-next-line no-unused-vars
    function setRowClass(index, value) {
        if (document.all) {
            if (value) {
                document.all['row' + index].className = 'rowSelected';
            } else {
                document.all['row' + index].className = 'rowUnselected';
            }
        } else if (!document.all && document.getElementById) {
            if (value) {
                document.getElementById('row' + index).className = 'rowSelected';
            } else {
                document.getElementById('row' + index).className = 'rowUnselected';
            }
        }
    }

    function toggleCheckBox(event, checkboxId) {
        event.preventDefault();
        var checkbox = document.getElementById(checkboxId);
        if (checkbox == null) {
            checkbox = document.all[checkboxId];
        }
        checkbox.checked = !checkbox.checked;
        processCBClick(event, checkbox);
        return false;
    }

    // eslint-disable-next-line no-unused-vars
    function moveToPage(start, inputSelector) {
        var form = AJS.$('form.aui');
        var startField = form.find('input[name="start"]');
        startField.val(start);

        // check we are in multi-select
        if (AJS.$('.selectorform').length > 0) {
            var prevSelected = form.find('input[name="previouslySelected"]');
            prevSelected.val(createPreviouslySelectedString(prevSelected.val(), inputSelector));
        }

        form.submit();
    }

    function createPreviouslySelectedString(currentSelected, inputSelector) {
        var selected = currentSelected;
        var selector = "input:checkbox[name=userchecks]";
        if (inputSelector && inputSelector !== "") {
            selector = inputSelector;
        }
        var checkboxes = AJS.$(document.selectorform).find(selector);
        checkboxes.each(function () {
            var item = this;
            if (item != null) {
                var userName = encodeUserName(item.value);
                selected = removeUserFromSelected(selected, userName);
                if (item.checked) {
                    if (selected.length === 0) {
                        selected += ';';
                    }
                    selected += userName;
                    selected += ';';
                }
            }
        });
        return selected;
    }

    function removeUserFromSelected(selectedString, encodedUserName) {
        return selectedString.replace(";" + encodedUserName + ";", ";");
    }

    function encodeUserName(userName) {
        return userName.replace(/;/, "%59");
    }

    function decodeUserName(userName) {
        return userName.replace(/%59/, ";");
    }

    return {
        rowHover: rowHover,
        setCheckboxes: setCheckboxes,
        selectSingleGroup: selectSingleGroup,
        selectSingleUser: selectSingleUser,
        processCBClick: processCBClick,
        setRadio: setRadio,
        selectMultiUser: selectMultiUser,
        toggleCheckBox: toggleCheckBox,
        addItemsToInputField: addItemsToInputField
    };
});