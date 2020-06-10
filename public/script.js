(function () {
    const canvas = document.getElementById("canvas");
    const signature = document.getElementById("signature");

    const ctx = canvas.getContext("2d");

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

    canvas.addEventListener("mousedown", (e) => {
        isSigning = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener("mousemove", sign);
    canvas.addEventListener("mouseup", () => {
        isSigning = false;
        canvasToDataURL();
    });
    canvas.addEventListener("mouseout", () => (isSigning = false));

    function canvasToDataURL() {
        signature.value = canvas.toDataURL();
    }
})();
