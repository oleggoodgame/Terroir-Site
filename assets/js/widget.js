(function () {
    'use strict';

    const MIN_BUDGET = 100;
    const MAX_BUDGET = 20000;
    const MAX_RESULTS = 6;
    const BUDGET_ERROR_TEXT = 'Введіть бюджет від 100 до 20000 ₴';
    const NOTES_ERROR_TEXT = 'Оберіть хоча б одну смакову ноту';
    const VALID_NOTES = new Set(['Briny', 'Nutty', 'Citrus', 'Honeyed', 'Herbal', 'Fruity', 'Oaky']);
    const VALID_REGIONS = new Set(['all', 'Закарпаття', 'Карпати', 'Одещина', 'Львівщина', 'Кахетія']);
    const NOTE_EXPLANATIONS = Object.freeze({
        Briny: 'соляна мінеральність додає глибини й освіжає смак',
        Nutty: 'горіхові відтінки м’яко підкреслюють вершковість',
        Citrus: 'цитрусова кислотність освіжає смак і врівноважує насиченість',
        Honeyed: 'медові тони додають м’якої солодкості',
        Herbal: 'трав’яні акценти додають свіжості й аромату гірських лук',
        Fruity: 'фруктові відтінки роблять смак соковитішим',
        Oaky: 'дубова витримка додає структури й тривалого післясмаку',
    });

    const PRODUCTS = Object.freeze([
        { name: 'Бринза овеча', category: 'cheese', region: 'Закарпаття', price: 450, notes: ['Briny'], image: 'assets/images/products/brinza.jpg' },
        { name: 'Ркацителі Amber', category: 'wine', region: 'Кахетія', price: 620, notes: ['Honeyed', 'Citrus'], image: 'assets/images/products/rkatsiteli.jpg' },
        { name: 'Гуцульський сир', category: 'cheese', region: 'Карпати', price: 380, notes: ['Nutty'], image: 'assets/images/products/hutsulsky-syr.jpg' },
        { name: 'Фетяска біла', category: 'wine', region: 'Закарпаття', price: 540, notes: ['Fruity', 'Herbal'], image: 'assets/images/products/feteasca-bila.jpg' },
        { name: 'Козячий сир з травами', category: 'cheese', region: 'Одещина', price: 410, notes: ['Herbal'], image: 'assets/images/products/goat-cheese-herbs.jpg' },
        { name: 'Каберне витримане', category: 'wine', region: 'Одещина', price: 780, notes: ['Oaky', 'Fruity'], image: 'assets/images/products/cabernet.jpg' },
        { name: 'Твердий сир 12 міс.', category: 'cheese', region: 'Львівщина', price: 560, notes: ['Nutty', 'Briny'], image: 'assets/images/products/hard-cheese-12m.jpg' },
        { name: 'Ігристе брют', category: 'wine', region: 'Закарпаття', price: 690, notes: ['Citrus'], image: 'assets/images/products/sparkling-brut.jpg' },
        { name: 'Козячий сир з медом і горіхами', category: 'cheese', region: 'Закарпаття', price: 520, notes: ['Honeyed', 'Nutty'], image: 'assets/images/products/goat-cheese-honey-nuts.jpg' },
        { name: 'Рікота з лимонною цедрою', category: 'cheese', region: 'Львівщина', price: 340, notes: ['Citrus', 'Herbal'], image: 'assets/images/products/ricotta-lemon-thyme.jpg' },
        { name: 'Вівчий сир у дубовій бочці', category: 'cheese', region: 'Карпати', price: 2400, notes: ['Oaky', 'Nutty'], image: 'assets/images/products/oak-aged-sheep-cheese.jpg' },
        { name: 'Шардоне витримане в дубі', category: 'wine', region: 'Закарпаття', price: 720, notes: ['Oaky', 'Nutty'], image: 'assets/images/products/chardonnay-oak.jpg' },
        { name: 'Токай Ашу 5 путтонів', category: 'wine', region: 'Закарпаття', price: 3200, notes: ['Honeyed', 'Fruity'], image: 'assets/images/products/tokaj-aszu-5.jpg' },
        { name: 'Рожеве Піно нуар', category: 'wine', region: 'Одещина', price: 590, notes: ['Fruity', 'Citrus'], image: 'assets/images/products/pinot-noir-rose.jpg' },
    ]);

    const initializedForms = new WeakSet();
    let budgetTouched = false;
    let notesTouched = false;
    let budgetDebounceTimer = null;

    /**
     * Повертає нормалізований режим вибору.
     * @param {string|undefined} mode Вхідне значення mode.
     * @returns {'cheese'|'wine'|'both'}
     */
    function normalizeMode(mode) {
        return mode === 'cheese' || mode === 'wine' || mode === 'both' ? mode : 'both';
    }

    /**
     * Повертає нормалізований регіон.
     * @param {string|undefined} region Вхідне значення region.
     * @returns {string}
     */
    function normalizeRegion(region) {
        return typeof region === 'string' && VALID_REGIONS.has(region) ? region : 'all';
    }

    /**
     * Нормалізує список нот, відкидає недопустимі та дублікати.
     * @param {Array<string>|undefined} notes Список нот.
     * @returns {string[]}
     */
    function normalizeNotes(notes) {
        if (!Array.isArray(notes)) {
            return [];
        }

        const result = [];
        const seen = new Set();

        notes.forEach((note) => {
            if (typeof note !== 'string') {
                return;
            }

            const cleaned = note.trim();
            if (!VALID_NOTES.has(cleaned) || seen.has(cleaned)) {
                return;
            }

            seen.add(cleaned);
            result.push(cleaned);
        });

        return result;
    }

    /**
     * Перевіряє, чи значення є кінцевим числом без небезпечних значень.
     * @param {*} value Вхідне значення.
     * @returns {boolean}
     */
    function isFiniteNumber(value) {
        if (typeof value === 'number') {
            return Number.isFinite(value);
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') {
                return false;
            }
            return Number.isFinite(Number(trimmed));
        }

        return false;
    }

    /**
     * Перевіряє бюджет користувача.
     * @param {string|number|undefined} value Вхідне значення бюджету.
     * @returns {{ valid: boolean, normalized: number|null }}
     */
    function validateBudget(value) {
        if (value === null || value === undefined) {
            return { valid: false, normalized: null };
        }

        const raw = typeof value === 'string' ? value.trim() : String(value).trim();
        if (raw === '') {
            return { valid: false, normalized: null };
        }

        const numericValue = Number(raw);
        if (!Number.isFinite(numericValue)) {
            return { valid: false, normalized: null };
        }

        const normalized = Math.round(numericValue);
        if (normalized < MIN_BUDGET || normalized > MAX_BUDGET) {
            return { valid: false, normalized: null };
        }

        return { valid: true, normalized };
    }

    /**
     * Зчитує поточний стан форми.
     * @returns {{ mode: 'cheese'|'wine'|'both', budget: string, notes: string[], region: string }}
     */
    function readFormState() {
        const form = document.getElementById('taste-form');
        const budgetInput = document.getElementById('budget');
        const regionSelect = document.getElementById('region');

        const checkedMode = form ? form.querySelector('input[name="mode"]:checked') : null;
        const rawMode = checkedMode ? checkedMode.value : 'both';
        const mode = normalizeMode(rawMode);
        const budget = budgetInput ? String(budgetInput.value ?? '').trim() : '';
        const noteInputs = Array.from(document.querySelectorAll('input[name="notes"]'));
        const notes = noteInputs
            .filter((input) => input.checked)
            .map((input) => input.value)
            .filter((value) => typeof value === 'string');
        const regionValue = regionSelect && typeof regionSelect.value === 'string' ? regionSelect.value : 'all';
        const region = normalizeRegion(regionValue);

        return { mode, budget, notes, region };
    }

    /**
     * Повертає стан валідації для поточного стану форми.
     * @param {{ mode: string, budget: string, notes: string[], region: string }} state Стан форми.
     * @returns {{ budgetValid: boolean, notesValid: boolean, isValid: boolean, budgetNormalized: number|null, notesNormalized: string[] }}
     */
    function validateState(state) {
        const budgetCheck = validateBudget(state.budget);
        const notesNormalized = normalizeNotes(state.notes);
        return {
            budgetValid: budgetCheck.valid,
            notesValid: notesNormalized.length > 0,
            isValid: budgetCheck.valid && notesNormalized.length > 0,
            budgetNormalized: budgetCheck.normalized,
            notesNormalized,
        };
    }

    /**
     * Розраховує рейтинг та рекомендації товарів.
     * @param {{ mode: string, budget: number|string|null, notes: string[], region: string }} input Вхідні дані.
     * @returns {{ items: Array<{ product: object, score: number, matches: string[] }>, total: number|null }}
     */
    function recommend(input) {
        if (!input || typeof input !== 'object') {
            return { items: [], total: null };
        }

        const safeMode = normalizeMode(input.mode);
        const safeRegion = normalizeRegion(input.region);
        const notesNormalized = normalizeNotes(Array.isArray(input.notes) ? input.notes : []);
        const numericBudget = isFiniteNumber(input.budget) ? Math.round(Number(input.budget)) : null;
        const budgetValue = numericBudget;

        if (budgetValue === null || budgetValue < MIN_BUDGET || budgetValue > MAX_BUDGET) {
            return { items: [], total: null };
        }

        const candidates = PRODUCTS.filter((product) => {
            if (safeMode !== 'both' && product.category !== safeMode) {
                return false;
            }
            return notesNormalized.some((note) => product.notes.includes(note));
        }).map((product) => {
            const matches = notesNormalized.filter((note) => product.notes.includes(note));
            const score = matches.length * 2 + (safeRegion !== 'all' && safeRegion === product.region ? 1 : 0);
            return {
                product,
                score,
                matches,
            };
        });

        if (safeMode === 'both') {
            const cheeseCandidates = candidates.filter((item) => item.product.category === 'cheese');
            const wineCandidates = candidates.filter((item) => item.product.category === 'wine');

            if (cheeseCandidates.length === 0 || wineCandidates.length === 0) {
                return { items: [], total: null };
            }

            let bestPair = null;

            cheeseCandidates.forEach((cheese) => {
                wineCandidates.forEach((wine) => {
                    const totalPrice = cheese.product.price + wine.product.price;
                    if (totalPrice > budgetValue) {
                        return;
                    }

                    const pair = {
                        items: [
                            { product: cheese.product, score: cheese.score, matches: cheese.matches },
                            { product: wine.product, score: wine.score, matches: wine.matches },
                        ],
                        total: totalPrice,
                        score: cheese.score + wine.score,
                    };

                    if (!bestPair || pair.score > bestPair.score || (pair.score === bestPair.score && pair.total < bestPair.total)) {
                        bestPair = pair;
                    }
                });
            });

            if (!bestPair) {
                return { items: [], total: null };
            }

            return {
                items: bestPair.items,
                total: bestPair.total,
            };
        }

        const filtered = candidates
            .filter((item) => item.product.price <= budgetValue)
            .sort((left, right) => right.score - left.score || left.product.price - right.product.price);

        const visibleItems = filtered.slice(0, MAX_RESULTS);

        return {
            items: visibleItems,
            total: visibleItems.length,
            foundCount: filtered.length,
        };
    }

    /**
     * Показує один стан результатів.
     * @param {'empty'|'none'|'list'} state Стан для показу.
     */
    function showState(state) {
        const empty = document.getElementById('results-empty');
        const none = document.getElementById('results-none');
        const list = document.getElementById('results-list');

        if (!empty || !none || !list) {
            return;
        }

        const stateMap = { empty, none, list };
        Object.entries(stateMap).forEach(([key, element]) => {
            element.classList.toggle('hidden', key !== state);
        });
    }

    /**
     * Забезпечує візуальний стан помилки для бюджету.
     * @param {boolean} isError Чи показувати помилку.
     */
    function applyBudgetErrorState(isError) {
        const budgetInput = document.getElementById('budget');
        const budgetError = document.getElementById('budget-error');

        if (!budgetInput) {
            return;
        }

        budgetInput.setAttribute('aria-describedby', isError ? 'budget-hint budget-error' : 'budget-hint');
        budgetInput.classList.remove('border-[#a89d92]', 'hover:border-[#f5f1ec]', 'focus-visible:border-[#f5f1ec]', 'border-red-500', 'hover:border-red-500', 'focus-visible:border-red-500');

        if (isError) {
            budgetInput.classList.add('border-red-500', 'hover:border-red-500', 'focus-visible:border-red-500');
            budgetInput.setAttribute('aria-invalid', 'true');
            if (budgetError) {
                budgetError.classList.remove('hidden');
            }
            return;
        }

        budgetInput.classList.add('border-[#a89d92]', 'hover:border-[#f5f1ec]', 'focus-visible:border-[#f5f1ec]');
        budgetInput.setAttribute('aria-invalid', 'false');
        if (budgetError) {
            budgetError.classList.add('hidden');
        }
    }

    /**
     * Забезпечує візуальний стан помилки для нот.
     * @param {boolean} isError Чи показувати помилку.
     */
    function applyNotesErrorState(isError) {
        const notesGroup = document.getElementById('notes-group');
        const notesError = document.getElementById('notes-error');
        const notesFieldset = notesGroup ? notesGroup.closest('fieldset') : null;
        const noteInputs = document.querySelectorAll('#taste-form input[name="notes"]');

        noteInputs.forEach((input) => {
            input.setAttribute('aria-invalid', String(isError));
        });

        if (notesFieldset) {
            if (isError) {
                notesFieldset.setAttribute('aria-describedby', 'notes-error');
            } else {
                notesFieldset.removeAttribute('aria-describedby');
            }
        }

        if (notesGroup) {
            notesGroup.classList.remove('border-transparent', 'border-red-500');
            if (isError) {
                notesGroup.classList.add('border-red-500');
            } else {
                notesGroup.classList.add('border-transparent');
            }
        }

        if (notesError) {
            if (isError) {
                notesError.classList.remove('hidden');
            } else {
                notesError.classList.add('hidden');
            }
        }
    }

    /**
     * Відновлює початковий стан віджета.
     */
    function resetWidget() {
        const form = document.getElementById('taste-form');
        if (form) {
            form.reset();
        }

        budgetTouched = false;
        notesTouched = false;

        applyBudgetErrorState(false);
        applyNotesErrorState(false);

        const resultsGrid = document.getElementById('results-grid');
        if (resultsGrid) {
            resultsGrid.replaceChildren();
        }

        const resultsSummary = document.getElementById('results-summary');
        if (resultsSummary) {
            resultsSummary.textContent = '';
        }

        const resultsExplain = document.getElementById('results-explain-text');
        if (resultsExplain) {
            resultsExplain.textContent = '';
        }

        showState('empty');
    }

    /**
     * Формує пояснення до результатів на основі вибору користувача.
     * @param {{ mode: string, notes: string[] }} state Стан форми.
     * @param {Array<{ product: object, score: number, matches: string[] }>} resultItems Рекомендовані товари.
     * @returns {string}
     */
    function buildExplanation(state, resultItems) {
        const selectedNotes = Array.isArray(state.notes) ? state.notes : [];
        const matchedNotes = [];
        const seen = new Set();

        selectedNotes.forEach((note) => {
            const found = resultItems.some((item) => item.matches.includes(note));
            if (found && !seen.has(note) && matchedNotes.length < 3) {
                matchedNotes.push(note);
                seen.add(note);
            }
        });

        if (matchedNotes.length === 0) {
            return '';
        }

        const explanationText = matchedNotes
            .map((note) => NOTE_EXPLANATIONS[note])
            .filter(Boolean)
            .join('; ');

        const prefix = state.mode === 'both' ? 'Ця пара працює, бо' : 'Ці товари підібрані, бо';
        return `${prefix} ваш профіль збігається за нотами ${matchedNotes.join(', ')}: ${explanationText}.`;
    }

    /**
     * Очищує контейнер карток.
     */
    function clearResultsGrid() {
        const resultsGrid = document.getElementById('results-grid');
        if (resultsGrid) {
            resultsGrid.replaceChildren();
        }
    }

    /**
     * Відображає список результатів.
     * @param {{ mode: string, budget: string, notes: string[], region: string }} state Поточний стан форми.
     */
    function renderResults(state) {
        if (!state || typeof state !== 'object') {
            clearResultsGrid();
            showState('empty');
            return;
        }

        const validation = validateState(state);
        const recommendation = recommend({
            mode: state.mode,
            budget: validation.budgetNormalized,
            notes: validation.notesNormalized,
            region: state.region,
        });

        if (!recommendation.items || recommendation.items.length === 0) {
            showState('none');
            clearResultsGrid();
            const explainText = document.getElementById('results-explain-text');
            if (explainText) {
                explainText.textContent = '';
            }
            return;
        }

        const targetGrid = document.getElementById('results-grid');
        const summary = document.getElementById('results-summary');
        const explainText = document.getElementById('results-explain-text');
        const template = document.getElementById('result-card-template');

        if (summary) {
            if (state.mode === 'both') {
                const pairPrice = recommendation.total ?? 0;
                summary.textContent = `Найкраща пара: ${pairPrice.toLocaleString('uk-UA')} ₴ разом`;
            } else {
                const foundCount = recommendation.foundCount ?? recommendation.items.length;
                const shownCount = recommendation.items.length;
                const labels = ['товар', 'товари', 'товарів'];
                const index = foundCount % 10 === 1 && foundCount % 100 !== 11 ? 0 : foundCount % 10 >= 2 && foundCount % 10 <= 4 && (foundCount % 100 < 10 || foundCount % 100 >= 20) ? 1 : 2;
                summary.textContent = foundCount > shownCount
                    ? `Показано ${shownCount} з ${foundCount} ${labels[index]}`
                    : `Знайдено ${foundCount} ${labels[index]}`;
            }
        }

        if (explainText) {
            explainText.textContent = buildExplanation(state, recommendation.items);
        }

        if (!targetGrid || !template) {
            showState('list');
            return;
        }

        const fragment = document.createDocumentFragment();

        recommendation.items.forEach((item) => {
            const card = template.content.cloneNode(true);
            const product = item.product;

            const image = card.querySelector('[data-field="image"]');
            if (image) {
                image.src = product.image;
                image.alt = product.name;
                image.addEventListener('error', () => {
                    image.classList.add('hidden');
                });
            }

            const meta = card.querySelector('[data-field="meta"]');
            if (meta) {
                meta.textContent = `${product.category === 'cheese' ? 'Сир' : 'Вино'} · ${product.region}`;
            }

            const title = card.querySelector('[data-field="name"]');
            if (title) {
                title.textContent = product.name;
            }

            const matchesList = card.querySelector('[data-field="matches"]');
            if (matchesList) {
                matchesList.replaceChildren();
                item.matches.forEach((match) => {
                    const listItem = document.createElement('li');
                    listItem.className = 'rounded bg-[#8c1c2b] px-2 py-0.5 text-xs text-white';
                    listItem.textContent = match;
                    matchesList.appendChild(listItem);
                });
            }

            const price = card.querySelector('[data-field="price"]');
            if (price) {
                price.textContent = `${product.price.toLocaleString('uk-UA')} ₴`;
            }

            fragment.appendChild(card);
        });

        targetGrid.replaceChildren(fragment);
        showState('list');
    }

    /**
     * Перераховує результат на основі поточного стану форми.
     */
    function refreshFromForm() {
        const formState = readFormState();
        const validation = validateState(formState);
        const shouldShowBudgetError = budgetTouched && !validation.budgetValid;
        const shouldShowNotesError = notesTouched && !validation.notesValid;

        applyBudgetErrorState(shouldShowBudgetError);
        applyNotesErrorState(shouldShowNotesError);

        if (!validation.isValid) {
            clearResultsGrid();
            showState('empty');
            return;
        }

        renderResults(formState);
    }

    /**
     * Ініціалізує віджет для конкретної форми.
     * @returns {void}
     */
    function init() {
        const criticalIds = ['taste-form', 'budget', 'taste-results', 'results-empty', 'results-none', 'results-list', 'results-grid', 'result-card-template'];
        const missingId = criticalIds.find((id) => !document.getElementById(id));
        if (missingId) {
            console.warn(`Відсутній критичний елемент: ${missingId}`);
            return;
        }

        const form = document.getElementById('taste-form');
        if (!form || initializedForms.has(form)) {
            return;
        }

        initializedForms.add(form);

        const budgetInput = document.getElementById('budget');
        const noteInputs = Array.from(document.querySelectorAll('input[name="notes"]'));
        const resetButton = document.getElementById('taste-reset');

        budgetInput.addEventListener('input', () => {
            budgetTouched = true;
            if (budgetDebounceTimer) {
                clearTimeout(budgetDebounceTimer);
            }
            budgetDebounceTimer = setTimeout(() => {
                refreshFromForm();
            }, 250);
        });

        budgetInput.addEventListener('blur', () => {
            budgetTouched = true;
            if (budgetDebounceTimer) {
                clearTimeout(budgetDebounceTimer);
                budgetDebounceTimer = null;
            }
            refreshFromForm();
        });

        noteInputs.forEach((input) => {
            input.addEventListener('change', () => {
                notesTouched = true;
                refreshFromForm();
            });
        });

        form.querySelectorAll('input[name="mode"]').forEach((input) => {
            input.addEventListener('change', refreshFromForm);
        });

        const regionSelect = document.getElementById('region');
        if (regionSelect) {
            regionSelect.addEventListener('change', refreshFromForm);
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            refreshFromForm();
        });

        if (resetButton) {
            resetButton.addEventListener('click', resetWidget);
        }

        resetWidget();
    }

    window.TerroirTasteProfile = Object.freeze({
        recommend,
        PRODUCTS,
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
}());
