const PHONE_REGEX = /^\+380\d{9}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;


const MIN_NAME_LENGTH = 2;
const MIN_MESSAGE_LENGTH = 10;

/* Для звичайних полів змінюємо також hover/focus-класи межі,
   щоб вони не перекривали поточний стан поля. */
const BORDER_STATES = {
    normal: ['border-[#a89d92]', 'hover:border-[#f5f1ec]', 'focus-visible:border-[#f5f1ec]'],
    error: ['border-red-500', 'hover:border-red-500', 'focus-visible:border-red-500'],
    success: ['border-green-500', 'hover:border-green-500', 'focus-visible:border-green-500'],
};

// Для чекбокса достатньо змінювати базовий клас межі.
const CHECKBOX_BORDER_STATES = {
    normal: ['border-[#a89d92]'],
    error: ['border-red-500'],
    success: ['border-green-500'],
};

/* Функції перевірки окремих полів. */
function validateName(value) {
    return value.length >= MIN_NAME_LENGTH;
}

function validateEmail(value) {
    return EMAIL_REGEX.test(value);
}

function validatePhone(value) {
    return PHONE_REGEX.test(value);
}

// Нормалізує введення телефону, не змінюючи суворого правила PHONE_REGEX.
function normalizePhoneValue(value) {
    const digits = value.replace(/\D/g, '');

    // Зберігаємо одиночний початковий плюс, щоб можна було поступово ввести +380.
    if (!digits) {
        return {
            value: value.trimStart().startsWith('+') ? '+' : '',
            addedPrefixDigits: 0,
        };
    }

    // Номер із кодом України лишається міжнародним незалежно від пробілів,
    // дужок чи дефісів, які могли бути під час вставлення.
    if (digits.startsWith('380')) {
        return { value: `+${digits}`, addedPrefixDigits: 0 };
    }

    // Український локальний номер 0XXXXXXXXX перетворюється на +380XXXXXXXXX.
    if (digits.startsWith('0')) {
        return { value: `+38${digits}`, addedPrefixDigits: 2 };
    }

    // Зберігаємо неповний міжнародний префікс під час його поступового введення.
    if (value.trimStart().startsWith('+')) {
        return { value: `+${digits}`, addedPrefixDigits: 0 };
    }

    // Не вгадуємо код для інших номерів: залишаємо цифри, а сувора перевірка
    // покаже помилку, якщо значення не відповідає формату +380XXXXXXXXX.
    return { value: digits, addedPrefixDigits: 0 };
}

// Очищає значення телефону та намагається зберегти позицію курсора під час редагування.
function normalizePhoneInput(input) {
    const originalValue = input.value;
    const selectionStart = input.selectionStart ?? originalValue.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const digitsBeforeStart = originalValue.slice(0, selectionStart).replace(/\D/g, '').length;
    const digitsBeforeEnd = originalValue.slice(0, selectionEnd).replace(/\D/g, '').length;
    const normalized = normalizePhoneValue(originalValue);

    if (normalized.value === originalValue) return;

    input.value = normalized.value;

    // Зсув на один символ враховує '+', а додані '38' — автопрефікс для номера з 0.
    const prefixOffset = normalized.value.startsWith('+') ? 1 : 0;
    const start = prefixOffset + normalized.addedPrefixDigits + digitsBeforeStart;
    const end = prefixOffset + normalized.addedPrefixDigits + digitsBeforeEnd;
    input.setSelectionRange(start, end);
}

function validateMessage(value) {
    return value.length >= MIN_MESSAGE_LENGTH;
}

function validateAgreement(isChecked) {
    return isChecked === true;
}

/* Замінює класи межі відповідно до стану поля. */
function setBorderState(input, state) {
    const states = input.type === 'checkbox' ? CHECKBOX_BORDER_STATES : BORDER_STATES;
    Object.values(states).forEach((classes) => input.classList.remove(...classes));
    input.classList.add(...states[state]);
}

// Показує помилку та встановлює червону межу.
function showError(input, errorEl) {
    setBorderState(input, 'error');
    errorEl.classList.remove('hidden');
}

// Ховає повідомлення про помилку та встановлює зелену межу.
function showSuccess(input, errorEl) {
    setBorderState(input, 'success');
    errorEl.classList.add('hidden');
}

// Повертає поле до початкового стану.
function clearError(input, errorEl) {
    setBorderState(input, 'normal');
    errorEl.classList.add('hidden');
}

/* Збирає поля, відповідні їм повідомлення про помилки та функції перевірки. */
function getFields() {
    const make = (id, validate) => ({
        input: document.getElementById(id),
        error: document.getElementById(`${id}Error`),
        validate,
    });

    return {
        username: make('username', validateName),
        email: make('email', validateEmail),
        phone: make('phone', validatePhone),
        message: make('message', validateMessage),
        agreement: make('agreement', validateAgreement),
    };
}

// Для email і телефону зберігає введений текст без обрізання пробілів.
function getValue(input) {
    if (input.type === 'checkbox') return input.checked;
    if (input.type === 'email' || input.type === 'tel') return input.value;
    return input.value.trim();
}

// Перевіряє одне поле та оновлює його візуальний стан.
function validateField(field) {
    const isValid = field.validate(getValue(field.input));

    if (isValid) {
        showSuccess(field.input, field.error);
    } else {
        showError(field.input, field.error);
    }

    return isValid;
}

// Відкриває підтвердження після успішної клієнтської валідації.
// Реального надсилання на сервер поки немає.
function handleValidSubmit(form, fields, touchedFields, successModal) {
    form.reset();
    Object.values(fields).forEach((field) => clearError(field.input, field.error));
    touchedFields.clear();
    successModal.open();
}

// На submit перевіряє всі поля та блокує відправлення, якщо є помилки.
function handleSubmit(event, form, fields, touchedFields, successModal) {
    event.preventDefault();

    // Не дозволяємо повторно обробляти submit, поки діалог відкритий.
    if (successModal.isOpen()) return;

    const allFields = Object.values(fields);
    allFields.forEach((field) => touchedFields.add(field.input));

    const invalidFields = allFields.filter((field) => !validateField(field));

    if (invalidFields.length > 0) {
        invalidFields[0].input.focus();
        return;
    }

    handleValidSubmit(form, fields, touchedFields, successModal);
}

// Налаштовує доступне модальне вікно та повертає його керування.
function createSuccessModal(form) {
    const modal = document.getElementById('successModal');
    const closeButton = document.getElementById('successModalClose');
    const submitButton = form.querySelector('button[type="submit"]');

    if (!modal || !closeButton || !submitButton) {
        throw new Error('Не знайдено модальне вікно, кнопку закриття або кнопку надсилання форми.');
    }

    let isOpen = false;
    let previousOverflow = '';
    let previousSubmitDisabled = false;
    let backgroundInertState = [];

    function close() {
        if (!isOpen) return;

        isOpen = false;
        modal.classList.add('hidden');
        document.body.style.overflow = previousOverflow;
        submitButton.disabled = previousSubmitDisabled;

        backgroundInertState.forEach(({ element, wasInert }) => {
            element.inert = wasInert;
        });
        backgroundInertState = [];

        // Повертаємо фокус туди, звідки користувач відкрив діалог.
        submitButton.focus();
    }

    function open() {
        if (isOpen) return;

        isOpen = true;
        previousOverflow = document.body.style.overflow;
        previousSubmitDisabled = submitButton.disabled;
        backgroundInertState = Array.from(document.body.children)
            .filter((element) => element !== modal && element.tagName !== 'SCRIPT')
            .map((element) => {
                const wasInert = element.inert;
                element.inert = true;
                return { element, wasInert };
            });

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        submitButton.disabled = true;
        closeButton.focus();
    }

    closeButton.addEventListener('click', close);

    // Клік усередині діалогу його не закриває — лише по backdrop.
    modal.addEventListener('click', (event) => {
        if (event.target === modal) close();
    });

    modal.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }

        if (event.key !== 'Tab') return;

        const focusableElements = Array.from(modal.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter((element) => !element.hasAttribute('hidden'));

        if (focusableElements.length === 0) {
            event.preventDefault();
            modal.focus();
            return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    });

    return {
        open,
        close,
        isOpen: () => isOpen,
    };
}

function init() {
    const form = document.getElementById('feedbackForm');
    if (!form) return;

    const fields = getFields();
    const touchedFields = new Set();
    const successModal = createSuccessModal(form);

    Object.values(fields).forEach((field) => {
        // Перша перевірка відбувається, коли користувач залишає поле.
        field.input.addEventListener('blur', () => {
            touchedFields.add(field.input);
            validateField(field);
        });

        // Нормалізація телефону працює відразу, але помилка не з'являється,
        // доки поле не пройшло першу перевірку через blur або submit.
        field.input.addEventListener('input', () => {
            if (field.input.type === 'tel') normalizePhoneInput(field.input);
            if (touchedFields.has(field.input)) validateField(field);
        });

        // Одразу оновлює стан чекбокса після зміни його значення.
        if (field.input.type === 'checkbox') {
            field.input.addEventListener('change', () => {
                touchedFields.add(field.input);
                validateField(field);
            });
        }
    });

    form.addEventListener('submit', (event) => {
        handleSubmit(event, form, fields, touchedFields, successModal);
    });
}

init();