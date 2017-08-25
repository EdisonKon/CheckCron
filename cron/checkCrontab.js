$(function () {
    'use strict';

    var crontabInputId = 'cron';
    var resultId = 'resultcron';
    var submitButtonId = 'check';
    var daysOfWeek = '日一二三四五六日';
    var rangeOfUnits = {
        '分': [0, 59],
        '时': [0, 23],
        '号': [1, 31],
        '月': [1, 12],
        '周': [0, 7]
    };
    var errors = {
        'error': 'error',
        'insufficient': '格式不符',
        'outOfRange': '超出界限',
        'unexpectedValue': 'unexpected value'
    };

    $('#' + crontabInputId).on('blur', function () {
        var crontab = $('#' + crontabInputId).val();
        var resultBox = $('#' + resultId);

        var lines = crontab.split(/\n/);

        // Initialize the result table
        var table = $('<table class="table table-bordered"></table>');
        table.append('<thead><tr><th>月</th><th>日</th><th>周</th><th>时</th><th>分</th></tr></thead>');

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            // Skip lines that start with #
            if (line.match(/^#/)) {
                continue;
            }

            // Skip empty lines
            if (line.match(/^\s*$/)) {
                continue;
            }

            // Split params with whitespace
            var params = line.split(/ +/);

            // Check if this line has at least 5 params
            if (params.length < 5) {
                table.append('<tbody><tr><td colspan="5">' + getErrorMessage(line, 'insufficient') + '</td></tr></tbody>');
                continue;
            }

            var minute, hour , day, month, dow, command;

            // Extract cron timing params
            var timings = params.splice(0, 5);
            minute = timings.shift();
            hour = timings.shift();
            day = timings.shift();
            month = timings.shift();
            dow = timings.shift();

            // Join params left as a line of a command
            if (params.length > 0) {
                command = params.join(' ');
            } else {
                command = '';
            }

            // Prepare a table body for the result
            var result = '<tbody>';

            // Add timings to the result
            result += '<tr>';
            result += describe(month, '月', false, '个月');
            result += describe(day, '号');
            result += describe(dow, '周', daysOfWeek, '周');
            result += describe(hour, '时', false, '小时');
            result += describe(minute, '分');
            result += '</tr>';

            // Add command to the result
            result += '<tr>';
            result += '<td class="left" colspan="5">' + htmlEscape(command) + '</td>';
            result += '</tr>';

            result += '</tbody>';

            table.append(result);
        }
        resultBox.html(table);
    });

    function describe(param, unit, convert, unitForInterval) {
        return '<td>' + parse(param, unit, convert, unitForInterval) + '</td>';
    }

    function parse(param, unit, convert, unitForInterval) {
        // Split the elements with `,` for multiple params
        var elements = param.split(',');

        // Initialize the result
        var result = '';

        // Get allowed ranges for this unit
        var rangeOfUnit = rangeOfUnits[unit];

        var element, interval, intervalElements, rangeElements;
        for (var i = 0; i < elements.length; i++) {
            intervalElements = elements[i].split('/');

            element = intervalElements[0];
            if (intervalElements.length === 2) {
                interval = intervalElements[1];
            } else {
                interval = undefined;
            }

            // Can not have more than 2 elements;
            if (intervalElements.length > 2) {
                return getErrorMessage(element);
            }

            if (element === '*') {
                if (interval && interval > 1) {
                	result += '<em>' + interval + (unitForInterval || unit) + '先</em>';
                } else {
//                    result += '<span class="gray">不限制</span>';
                    result += '<span >每个</span>';
                }
            } else {
                if (i >= 1) {
                    result += ', <br>';
                }

                // Split the element with `-` for range
                rangeElements = element.split('-');

                // Range can not have more than 2 elements
                if (rangeElements.length > 2) {
                    return getErrorMessage(element);
                }

                // Check if each element is within allowed range
                for (var j = 0; j < rangeElements.length; j++) {
                    if (rangeElements[j] < rangeOfUnit[0] || rangeElements[j] > rangeOfUnit[1]) {
                        return getErrorMessage(element, 'outOfRange');
                    }
                }

                // Check if each element has expected values only
                if (!expectedValuesOnly(rangeElements)) {
                    return getErrorMessage(element, 'unexpectedValue');
                }

                // Convert values if specified
                if (convert) {
                    rangeElements[0] = convert.charAt(rangeElements[0]);
                }
                if(unit == "周"){
                	rangeElements[0] = '<em>' + unit + htmlEscape(rangeElements[0]) + '</em>';
            	}else{
            		rangeElements[0] = '<em>' + htmlEscape(rangeElements[0]) + unit + '</em>';
            	}

                // Apply the above to the second element, if any
                if (rangeElements[1]) {
                    if (convert) {
                        rangeElements[1] = convert.charAt(rangeElements[1]);
                    }
                    if(unit == "周"){
                    	rangeElements[1] = '<em>' + unit + htmlEscape(rangeElements[1]) + '</em>';
                	}else{
                		rangeElements[1] = '<em>' + htmlEscape(rangeElements[1]) + unit + '</em>';
                	}
                }

                // Join the minimum and the maximum;
                // do nothing is the element is not a range
                element = rangeElements.join('到');

                result += element;
                if (interval && interval > 1) {
                    result += '每<em>' + interval + (unitForInterval || unit) + '</em>';
                }
            }
        }
        return result;
    }

    function getErrorMessage(data, type) {
        // Set type 'error' if type is omitted or error message is not assigned
        if (typeof type === 'undefined' || !errors[type]) {
            type = 'error';
        }
        // Get an error indicator
        var error = errors[type];

        // If data is given, add separator
        if (data) {
            error += ': ';
        } else {
            // Set void string in case data is null
            data = '';
        }

        return '<span class="error">' + error + data + '</span>';
    }

    function expectedValuesOnly(values) {
        var result = true;
        for ( var i in values) {
        	values[i] = values[i].replace(/JAN/i, 1);
            values[i] = values[i].replace(/FEB/i, 2);
            values[i] = values[i].replace(/MAR/i, 3);
            values[i] = values[i].replace(/APR/i, 4);
            values[i] = values[i].replace(/MAY/i, 5);
            values[i] = values[i].replace(/JUN/i, 6);
            values[i] = values[i].replace(/JUL/i, 7);
            values[i] = values[i].replace(/AUG/i, 8);
            values[i] = values[i].replace(/SEP/i, 9);
            values[i] = values[i].replace(/OCT/i, 10);
            values[i] = values[i].replace(/NOV/i, 11);
            values[i] = values[i].replace(/DEC/i, 12);
            
            values[i] = values[i].replace(/SUN/i, 7 );
            values[i] = values[i].replace(/MON/i, 1 );
            values[i] = values[i].replace(/TUE/i, 2 );
            values[i] = values[i].replace(/WED/i, 3 );
            values[i] = values[i].replace(/THU/i, 4 );
            values[i] = values[i].replace(/FRI/i, 5 );
            values[i] = values[i].replace(/SAT/i, 6 ); 
		}
        
        
        $(values).each(function () {
            if (!this.match(/^[0-9\*\/]+$/)) {
                result = false;
            }
        });
        return result;
    }

    function htmlEscape(str) {
        return $('<div>').text(str).html();
    }
});
