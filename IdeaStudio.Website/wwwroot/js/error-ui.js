(function () {
    var ui = document.getElementById('blazor-error-ui');
    if (!ui) return;
    var dismiss = ui.querySelector('.dismiss');
    if (!dismiss) return;
    dismiss.addEventListener('click', function () {
        ui.style.display = 'none';
    });
})();
