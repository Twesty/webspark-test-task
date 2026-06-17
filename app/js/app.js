document.addEventListener('DOMContentLoaded', () => {
    const eventsList = document.getElementById('events-list');

    if (!eventsList) return;

    const eventItems = eventsList.querySelectorAll('.events__item');
    const viewButtons = document.querySelectorAll('[data-events-view]');

    const views = ['list', 'grid'];

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const view = button.dataset.eventsView;

            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            eventsList.classList.remove(...views.map(v => `${v}-view`));
            eventsList.classList.add(`${view}-view`);

            eventItems.forEach(item => {
                item.classList.remove(...views.map(v => `${v}-view`));
                item.classList.add(`${view}-view`);
            });
        });
    });


    const pickers = {};
    pickers['#date-to'] = new AirDatepicker('#date-to', {
        showEvent: false,
        autoClose: true,
        onSelect({ date }) {
            pickers['#date-from'].update({
                maxDate: date,
            });
        },
    });

    pickers['#date-from'] = new AirDatepicker('#date-from', {
        showEvent: false,
        autoClose: true,
        onSelect({ date }) {
            pickers['#date-to'].update({
                minDate: date,
            });
        },
    });

    document.addEventListener('click', event => {
        const openBtn = event.target.closest('[data-datepicker-open]');

        if (openBtn) {
            pickers[openBtn.dataset.datepickerOpen]?.show();
            return;
        }

        const clearBtn = event.target.closest('[data-datepicker-clear]');

        if (clearBtn) {
            const picker = pickers[clearBtn.dataset.datepickerClear];

            picker?.clear();

            if (picker === pickers['#date-from']) {
                pickers['#date-to'].update({
                    minDate: '',
                });
            }

            if (picker === pickers['#date-to']) {
                pickers['#date-from'].update({
                    maxDate: '',
                });
            }

            return;
        }

        const isDatepicker = event.target.closest('.air-datepicker');
        const isInput =
            event.target.closest('#date-from') ||
            event.target.closest('#date-to');

        if (!isDatepicker && !isInput) {
            Object.values(pickers).forEach(picker => {
                if (picker.visible) {
                    picker.hide();
                }
            });
        }
    });
});