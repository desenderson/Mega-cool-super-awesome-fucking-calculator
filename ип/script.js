document.addEventListener('DOMContentLoaded', function() {
    // Элементы для переключения калькуляторов
    const calcButtons = document.querySelectorAll('.calc-btn');
    const calcSections = document.querySelectorAll('.calc-section');
    
    // История вычислений
    let calculationHistory = JSON.parse(localStorage.getItem('calcHistory')) || [];
    
    // Инициализация
    updateHistoryDisplay();
    
    // Переключение между калькуляторами
    calcButtons.forEach(button => {
        button.addEventListener('click', function() {
            const calcId = this.getAttribute('data-calc');
            
            // Обновляем активные кнопки
            calcButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем соответствующий калькулятор
            calcSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `calculator${calcId}`) {
                    section.classList.add('active');
                }
            });
            
            // Очищаем ошибки
            clearAllErrors();
        });
    });
    
    // =================== КАЛЬКУЛЯТОР 1: Обычный калькулятор ===================
    const expressionInput = document.getElementById('expression');
    const calculateBtn = document.getElementById('calculateBtn');
    const result1 = document.querySelector('#result1 .result-value');
    const error1 = document.getElementById('error1');
    const keypadButtons = document.querySelectorAll('.keypad-btn');
    
    // Обработка кнопок клавиатуры калькулятора
    keypadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const key = this.getAttribute('data-key');
            
            if (key === 'clear') {
                expressionInput.value = '';
            } else if (key === '=') {
                calculateExpression();
            } else {
                expressionInput.value += key;
            }
            
            expressionInput.focus();
        });
    });
    
    // Вычисление выражения
    calculateBtn.addEventListener('click', calculateExpression);
    
    expressionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateExpression();
        }
    });
    
    function calculateExpression() {
        const expression = expressionInput.value.trim();
        
        if (!expression) {
            showError('error1', 'Введите выражение для вычисления');
            return;
        }
        
        // Проверка на безопасность (аналог проверки в Python)
        if (!isValidExpression(expression)) {
            showError('error1', 'Выражение содержит недопустимые символы');
            return;
        }
        
        try {
            // Заменяем символы для корректного вычисления
            let evalExpression = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/\^/g, '**');
            
            // Используем Function для безопасного вычисления
            const result = Function('"use strict"; return (' + evalExpression + ')')();
            
            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Некорректный результат');
            }
            
            // Форматируем результат
            const formattedResult = formatNumber(result);
            
            // Отображаем результат
            result1.textContent = formattedResult;
            result1.style.color = '#2ecc71';
            
            // Добавляем в историю
            addToHistory(expression, formattedResult);
            
            // Очищаем ошибку
            hideError('error1');
            
        } catch (error) {
            console.error('Ошибка вычисления:', error);
            
            // Определяем тип ошибки
            if (error.message.includes('division by zero') || expression.includes('/0')) {
                showError('error1', 'Ошибка: деление на ноль!');
            } else if (error instanceof SyntaxError) {
                showError('error1', 'Ошибка: неправильное математическое выражение');
            } else {
                showError('error1', 'Произошла ошибка при вычислении. Проверьте выражение.');
            }
        }
    }
    
    // =================== КАЛЬКУЛЯТОР 2: Квадратные уравнения ===================
    const coeffA = document.getElementById('coeffA');
    const coeffB = document.getElementById('coeffB');
    const coeffC = document.getElementById('coeffC');
    const solveQuadraticBtn = document.getElementById('solveQuadraticBtn');
    const result2 = document.querySelector('#result2 .result-value');
    const error2 = document.getElementById('error2');
    
    solveQuadraticBtn.addEventListener('click', solveQuadraticEquation);
    
    function solveQuadraticEquation() {
        const a = parseFloat(coeffA.value);
        const b = parseFloat(coeffB.value);
        const c = parseFloat(coeffC.value);
        
        // Проверка ввода
        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            showError('error2', 'Пожалуйста, введите все коэффициенты');
            return;
        }
        
        if (a === 0) {
            showError('error2', 'Коэффициент "a" не может быть равен нулю для квадратного уравнения');
            return;
        }
        
        // Вычисление дискриминанта
        const discriminant = b * b - 4 * a * c;
        
        let solution;
        
        if (discriminant > 0) {
            // Два корня
            const sqrtD = Math.sqrt(discriminant);
            const x1 = (-b + sqrtD) / (2 * a);
            const x2 = (-b - sqrtD) / (2 * a);
            
            solution = `Уравнение имеет 2 корня:<br>
                       <strong>x₁ = ${formatNumber(x1)}</strong><br>
                       <strong>x₂ = ${formatNumber(x2)}</strong>`;
            
            // Добавляем в историю
            addToHistory(`${a}x² + ${b}x + ${c} = 0`, `x₁=${formatNumber(x1)}, x₂=${formatNumber(x2)}`);
            
        } else if (discriminant === 0) {
            // Один корень
            const x = -b / (2 * a);
            
            solution = `Уравнение имеет один корень:<br>
                       <strong>x = ${formatNumber(x)}</strong>`;
            
            // Добавляем в историю
            addToHistory(`${a}x² + ${b}x + ${c} = 0`, `x=${formatNumber(x)}`);
            
        } else {
            // Нет действительных корней
            solution = 'Уравнение не имеет действительных корней (D < 0)';
            
            // Добавляем в историю
            addToHistory(`${a}x² + ${b}x + ${c} = 0`, 'Нет действительных корней');
        }
        
        // Отображаем результат
        result2.innerHTML = solution;
        result2.style.color = '#2c3e50';
        hideError('error2');
    }
    
    // =================== КАЛЬКУЛЯТОР 3: Линейные уравнения ===================
    const num1Input = document.getElementById('num1');
    const num2Input = document.getElementById('num2');
    const equalsInput = document.getElementById('equals');
    const hasX1Checkbox = document.getElementById('hasX1');
    const hasX2Checkbox = document.getElementById('hasX2');
    const solveLinearBtn = document.getElementById('solveLinearBtn');
    const equationPreview = document.getElementById('equationPreview');
    const result3 = document.querySelector('#result3 .result-value');
    const error3 = document.getElementById('error3');
    
    // Обновление предпросмотра уравнения
    function updateEquationPreview() {
        const c1 = num1Input.value || 'c₁';
        const c2 = num2Input.value || 'c₂';
        const c3 = equalsInput.value || 'c₃';
        
        let equation = '';
        
        if (hasX1Checkbox.checked) {
            equation += `${c1}x`;
        } else {
            equation += c1;
        }
        
        equation += ' + ';
        
        if (hasX2Checkbox.checked) {
            equation += `${c2}x`;
        } else {
            equation += c2;
        }
        
        equation += ` = ${c3}`;
        
        equationPreview.textContent = equation;
    }
    
    // Смотрящие для обновления предпросмотра
    [num1Input, num2Input, equalsInput, hasX1Checkbox, hasX2Checkbox].forEach(element => {
        element.addEventListener('input', updateEquationPreview);
        element.addEventListener('change', updateEquationPreview);
    });
    
    // Решение линейного уравнения
    solveLinearBtn.addEventListener('click', solveLinearEquation);
    
    function solveLinearEquation() {
        const c1 = parseFloat(num1Input.value);
        const c2 = parseFloat(num2Input.value);
        const c3 = parseFloat(equalsInput.value);
        const hasX1 = hasX1Checkbox.checked;
        const hasX2 = hasX2Checkbox.checked;
        
        // Проверка ввода
        if (isNaN(c1) || isNaN(c2) || isNaN(c3)) {
            showError('error3', 'Пожалуйста, введите все числа');
            return;
        }
        
        // Проверка логики
        if (!hasX1 && !hasX2) {
            showError('error3', 'Хотя бы одно число должно содержать x');
            return;
        }
        
        if (hasX1 && hasX2) {
            // Оба содержат x: (c₁ + c₂)x = c₃
            if (c1 + c2 === 0) {
                if (c3 === 0) {
                    result3.innerHTML = 'Уравнение имеет бесконечно много решений (x - любое число)';
                    addToHistory(`${c1}x + ${c2}x = ${c3}`, 'Бесконечно много решений');
                } else {
                    result3.innerHTML = 'Уравнение не имеет решений';
                    addToHistory(`${c1}x + ${c2}x = ${c3}`, 'Нет решений');
                }
            } else {
                const x = c3 / (c1 + c2);
                result3.innerHTML = `<strong>x = ${formatNumber(x)}</strong>`;
                addToHistory(`${c1}x + ${c2}x = ${c3}`, `x=${formatNumber(x)}`);
            }
            
        } else if (hasX1 && !hasX2) {
            // Только первое содержит x: c₁x + c₂ = c₃
            if (c1 === 0) {
                if (c2 === c3) {
                    result3.innerHTML = 'Уравнение имеет бесконечно много решений (x - любое число)';
                    addToHistory(`${c1}x + ${c2} = ${c3}`, 'Бесконечно много решений');
                } else {
                    result3.innerHTML = 'Уравнение не имеет решений';
                    addToHistory(`${c1}x + ${c2} = ${c3}`, 'Нет решений');
                }
            } else {
                const x = (c3 - c2) / c1;
                result3.innerHTML = `<strong>x = ${formatNumber(x)}</strong>`;
                addToHistory(`${c1}x + ${c2} = ${c3}`, `x=${formatNumber(x)}`);
            }
            
        } else if (!hasX1 && hasX2) {
            // Только второе содержит x: c₁ + c₂x = c₃
            if (c2 === 0) {
                if (c1 === c3) {
                    result3.innerHTML = 'Уравнение имеет бесконечно много решений (x - любое число)';
                    addToHistory(`${c1} + ${c2}x = ${c3}`, 'Бесконечно много решений');
                } else {
                    result3.innerHTML = 'Уравнение не имеет решений';
                    addToHistory(`${c1} + ${c2}x = ${c3}`, 'Нет решений');
                }
            } else {
                const x = (c3 - c1) / c2;
                result3.innerHTML = `<strong>x = ${formatNumber(x)}</strong>`;
                addToHistory(`${c1} + ${c2}x = ${c3}`, `x=${formatNumber(x)}`);
            }
        }
        
        result3.style.color = '#2c3e50';
        hideError('error3');
    }
    
    // =================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===================
    
    // Проверка безопасности выражения
    function isValidExpression(expr) {
        // Разрешаем цифры, основные операторы, скобки, точку и пробелы
        const validChars = /^[0-9+\-*/().\s×÷^]*$/;
        
        if (!validChars.test(expr)) {
            return false;
        }
        
        // Проверяем сбалансированность скобок
        let balance = 0;
        for (let char of expr) {
            if (char === '(') balance++;
            if (char === ')') balance--;
            if (balance < 0) return false; // Закрывающая скобка раньше открывающей
        }
        
        return balance === 0; // Все скобки должны быть закрыты
    }
    
    // Форматирование чисел
    function formatNumber(num) {
        // Округляем до 10 знаков после запятой и убираем лишние нули
        const rounded = Math.round(num * 10000000000) / 10000000000;
        
        // Проверяем, является ли число целым
        if (Math.abs(rounded - Math.round(rounded)) < 0.0000000001) {
            return Math.round(rounded).toString();
        }
        
        return rounded.toString();
    }
    
    // Управление ошибками
    function showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        const errorText = errorElement.querySelector('.error-text');
        
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    function hideError(errorId) {
        document.getElementById(errorId).classList.add('hidden');
    }
    
    function clearAllErrors() {
        document.querySelectorAll('.error-box').forEach(error => {
            error.classList.add('hidden');
        });
    }
    
    // Управление историей
    function addToHistory(expression, result) {
        const historyItem = {
            id: Date.now(),
            expression: expression,
            result: result,
            timestamp: new Date().toLocaleString('ru-RU')
        };
        
        calculationHistory.unshift(historyItem);
        
        // Сохраняем только последние 20 записей
        if (calculationHistory.length > 20) {
            calculationHistory = calculationHistory.slice(0, 20);
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('calcHistory', JSON.stringify(calculationHistory));
        
        // Обновляем отображение
        updateHistoryDisplay();
    }
    
    function updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        
        if (calculationHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">Здесь будут отображаться ваши вычисления</div>';
            return;
        }
        
        historyList.innerHTML = calculationHistory.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-expression">${item.expression}</div>
                    <div class="history-timestamp">${item.timestamp}</div>
                </div>
                <div class="history-result">${item.result}</div>
            </div>
        `).join('');
    }
    
    // Очистка истории
    document.getElementById('clearHistoryBtn').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите очистить историю вычислений?')) {
            calculationHistory = [];
            localStorage.removeItem('calcHistory');
            updateHistoryDisplay();
        }
    });
    
    // Инициализация предпросмотра уравнения
    updateEquationPreview();
    
    // Примеры для быстрого тестирования
    function loadExample(calculator, example) {
        if (calculator === 1) {
            expressionInput.value = example;
        } else if (calculator === 2) {
            const [a, b, c] = example;
            coeffA.value = a;
            coeffB.value = b;
            coeffC.value = c;
            solveQuadraticEquation();
        } else if (calculator === 3) {
            const [c1, hasX1, c2, hasX2, c3] = example;
            num1Input.value = c1;
            num2Input.value = c2;
            equalsInput.value = c3;
            hasX1Checkbox.checked = hasX1;
            hasX2Checkbox.checked = hasX2;
            updateEquationPreview();
            solveLinearEquation();
        }
    }
    // Добавь этот код в конец твоего script.js

// Git функционал
document.addEventListener('DOMContentLoaded', function() {
    // Показать/скрыть терминал с командами Git
    const showTerminalBtn = document.getElementById('showTerminalBtn');
    const terminalCode = document.getElementById('terminalCode');
    const copyGitCommandsBtn = document.getElementById('copyGitCommands');
    const deployBtn = document.getElementById('deployBtn');
    
    if (showTerminalBtn) {
        showTerminalBtn.addEventListener('click', function() {
            terminalCode.style.display = terminalCode.style.display === 'block' ? 'none' : 'block';
            this.innerHTML = terminalCode.style.display === 'block' 
                ? '<i class="fas fa-times"></i> Скрыть команды Git' 
                : '<i class="fas fa-terminal"></i> Показать команды Git';
        });
    }
    
    // Копирование команд Git в буфер обмена
    if (copyGitCommandsBtn) {
        copyGitCommandsBtn.addEventListener('click', function() {
            const commands = `# Инициализация Git репозитория
git init

# Добавление всех файлов
git add .

# Создание первого коммита
git commit -m "Добавлены математические калькуляторы"

# Создание репозитория на GitHub и привязка
git remote add origin https://github.com/desenderson/Mega-cool-super-awesome-fucking-calculator.git
git branch -M main
git push -u origin main

# Команда для обновления сайта:
git add . && git commit -m "Обновление" && git push origin main`;
            
            navigator.clipboard.writeText(commands).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> Команды скопированы!';
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            });
        });
    }
    
    // Кнопка деплоя
    if (deployBtn) {
        deployBtn.addEventListener('click', function() {
            if (confirm('Хотите открыть инструкцию по деплою на GitHub Pages?')) {
                window.open('https://docs.github.com/ru/pages/getting-started-with-github-pages/creating-a-github-pages-site', '_blank');
            }
        });
    }
    
    // Автогенерация .gitignore при первом запуске (симуляция)
    const gitIgnoreContent = `# Исключаемые файлы
node_modules/
.env
.DS_Store
*.log
*.tmp
*.temp

# Исключения для систем контроля версий
.git/
.svn/

# Исключения для редакторов
.vscode/
.idea/
*.swp
*.swo`;
    
    // Сохраняем историю вычислений в localStorage
    window.saveToHistory = function(operation, result) {
        const historyItem = {
            id: Date.now(),
            operation: operation,
            result: result,
            timestamp: new Date().toLocaleString('ru-RU'),
            calculator: document.querySelector('.calc-btn.active').textContent.trim()
        };
        
        let history = JSON.parse(localStorage.getItem('mathCalculationsHistory')) || [];
        history.unshift(historyItem);
        if (history.length > 20) history = history.slice(0, 20);
        localStorage.setItem('mathCalculationsHistory', JSON.stringify(history));
        updateHistoryDisplay();
    };
    
    // Обновление отображения истории
    function updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        const history = JSON.parse(localStorage.getItem('mathCalculationsHistory')) || [];
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">Здесь будут отображаться ваши вычисления</div>';
            return;
        }
        
        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-operation">
                    <strong>${item.calculator}</strong><br>
                    ${item.operation}
                </div>
                <div class="history-result">
                    <strong>= ${item.result}</strong>
                </div>
                <div class="history-time">
                    <small>${item.timestamp}</small>
                </div>
            </div>
        `).join('');
    }
    
    // Инициализация истории при загрузке
    updateHistoryDisplay();
    
    // Очистка истории
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm('Удалить всю историю вычислений?')) {
                localStorage.removeItem('mathCalculationsHistory');
                updateHistoryDisplay();
            }
        });
    }
});
});