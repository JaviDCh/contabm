

import numeral from 'numeral';
import moment from 'moment';

// DdpEvents = new EventDDP('raix:push');
EventDDP = new EventDDP('test');

// switch between languages
numeral.register('locale', 'es', {
    delimiters: {
        thousands: '.',
        decimal: ','
    }
});

// switch between locales
numeral.locale('es')

moment.locale('es'); // change the global locale to Spanish