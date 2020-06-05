(function () {
    console.log("hello");
    const canvas = document.getElementsByName("canvas");
    console.log(canvas[0]);
    const signature = document.getElementsByName("signature");
    const submit = document.getElementsByName("submit");

    const ctx = canvas[0].getContext("2d");

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
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

    canvas[0].addEventListener("mousedown", (e) => {
        isSigning = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas[0].addEventListener("mousemove", sign);
    canvas[0].addEventListener("mouseup", () => (isSigning = false));
    canvas[0].addEventListener("mouseout", () => (isSigning = false));

    function canvasToUrl() {
        signature[0].value = canvas.toDataUrl();
        console.log("signature.value:", signature[0].value);
    }

    submit[0].addEventListener("mousedown", canvasToUrl);
})();
