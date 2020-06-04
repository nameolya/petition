(function () {
    const canvas = document.getElementsByName("canvas");
    const signature = document.getElementsByName("signature");
    const submit = document.getElementsByName("submit");

    const ctx = canvas.getContext("2d");

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 20;
    ctx.strokeStyle = "black";

    let isSigning = false;
    let lastX = 0;
    let lastY = 0;

    function sign(e) {
        if (!isSigning) {
            return;
        } else {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }
    }

    canvas.addEventListener("mousedown", (e) => {
        isSigning = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener("mousemove", sign);
    canvas.addEventListener("mouseup", () => (isSigning = false));
    canvas.addEventListener("mouseout", () => (isSigning = false));

    function canvasToUrl() {
        signature.value = canvas.toDataUrl();
        console.log("signature.value:", signature.value);
    }

    submit.addEventListener("mousedown", canvasToUrl);
})();
