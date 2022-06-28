import './App.css';
import { useEffect, useRef } from 'react';
import { Button } from 'antd';
import { fabric } from 'fabric';
// 启用橡皮擦功能需要额外引入 eraser_brush_mixin.js
import 'fabric/src/mixins/eraser_brush.mixin.js';
// import { ResizeObserver } from '@juggle/resize-observer';

let canvasAction = 'pencil'; // 'pencil'|'line'|'rect'|'circle'|'Eraser'|'select'
let mouseFrom = {};
let mouseTo = {};
function App() {
    const canvasEl = useRef(null);
    const canvasBox = useRef(null);
    let canvas = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            if (canvas.current && canvasBox.current) {
                // canvas.current.setDimensions({
                //     width: (960 * (16 /9)),
                // 	height: (960)
                // },{backstoreOnly: true});
				canvas.current.setDimensions({
					width: canvasBox.current.clientWidth + "px",
					height: canvasBox.current.clientHeight + "px"
				}, {cssOnly: true})
                canvas.current.renderAll();
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        let drawingObject = null;
        let textObject = null;
		const borderColor = '#ccc';
		const fillColor = 'transparent';
		const strokeColor = '#000';
		const lineSize = 5;
		const fontSize = 20;
        // 绘制直线
        const drawLine = () => {
            // 根据保存的鼠标起始点坐标 创建直线对象
            let canvasObject = new fabric.Line(
                [
                    getTransformedPosX(mouseFrom.x),
                    getTransformedPosY(mouseFrom.y),
                    getTransformedPosX(mouseTo.x),
                    getTransformedPosY(mouseTo.y),
                ],
                {
                    fill: fillColor,
                    stroke: strokeColor,
                    strokeWidth: lineSize,
                }
            );
            startDrawingObject(canvasObject);
        };

        // 绘制矩形
        const drawRect = (absolutePointer) => {
            // 计算矩形长宽
            let left = getTransformedPosX(mouseFrom.x);
            let top = getTransformedPosY(mouseFrom.y);

            left = absolutePointer.x < left ? absolutePointer.x : left;
            top = absolutePointer.y < top ? absolutePointer.y : top;
            let width = Math.abs(mouseTo.x - mouseFrom.x);
            let height = Math.abs(mouseTo.y - mouseFrom.y);
            // console.log('创建矩形:', left, top, width, height)
            // 创建矩形 对象
            let canvasObject = new fabric.Rect({
                left: left,
                top: top,
                width: width,
                height: height,
                stroke: strokeColor,
                fill: fillColor,
                strokeWidth: lineSize,
            });
            // 绘制矩形
            startDrawingObject(canvasObject);
        };

        // 绘制圆形
        const drawCircle = () => {
            let left = getTransformedPosX(mouseFrom.x);
            let top = getTransformedPosY(mouseFrom.y);
            // 计算圆形半径
            let radius =
                Math.sqrt(
                    (getTransformedPosX(mouseTo.x) - left) * (getTransformedPosX(mouseTo.x) - left) +
                        (getTransformedPosY(mouseTo.y) - top) * (getTransformedPosY(mouseTo.y) - top)
                ) / 2;
            // 创建 原型对象
            let canvasObject = new fabric.Circle({
                left: left,
                top: top,
                stroke: strokeColor,
                fill: fillColor,
                radius: radius,
                strokeWidth: lineSize,
                // originX: left,
                // originY: top,
                // centeredScaling: true
            });
            startDrawingObject(canvasObject);
        };

        // 因为画布会进行移动或缩放，所以鼠标在画布上的坐标需要进行相应的处理才是相对于画布的可用坐标
        const getTransformedPosX = (x) => {
            let zoom = Number(canvas.current.getZoom());
            return (x - canvas.current.viewportTransform[4]) / zoom;
        };
        const getTransformedPosY = (y) => {
            let zoom = Number(canvas.current.getZoom());
            return (y - canvas.current.viewportTransform[5]) / zoom;
        };

        // 绘制图形
        const startDrawingObject = (canvasObject) => {
            // 禁止用户选择当前正在绘制的图形
            canvasObject.selectable = false;
            // 如果当前图形已绘制，清除上一次绘制的图形
            if (drawingObject) {
                canvas.current.remove(drawingObject);
            }
            // 将绘制对象添加到 canvas中
            canvas.current.add(canvasObject);
            // 保存当前绘制的图形
            drawingObject = canvasObject;
        };

		// 绘制文本
        const drawText = () => {
            if (!textObject) {
                // 创建文本对象
                textObject = new fabric.Textbox('', {
                    left: getTransformedPosX(mouseFrom.x),
                    top: getTransformedPosY(mouseFrom.y),
                    fontSize: fontSize,
                    fill: strokeColor,
                    hasControls: true,
                    editable: true,
                    width: 30,
					padding: 5,
                    backgroundColor: '#fff',
                    selectable: false,
					hoverCursor: 'text',
					editingBorderColor: borderColor,
					charSpacing: 2, // 没生效
					// fontStyle: 'oblique',
					// textBackgroundColor: '#ccc',
                });
                canvas.current.add(textObject);
                // 文本打开编辑模式
				canvas.current.setActiveObject(textObject)
                textObject.enterEditing();
                // 文本编辑框获取焦点
                textObject.hiddenTextarea.focus();
            } else {
                endDrawText();
            }
        };

		const endDrawText = () => {
			if (textObject) {
				// 将当前文本对象退出编辑模式
                textObject.exitEditing();
                textObject.set('backgroundColor', 'rgba(0,0,0,0)');
                if (textObject.text === '') {
                    canvas.current.remove(textObject);
                }
                canvas.current.renderAll();
                textObject = null;
			}
		}

        const options = {
            enableRetinaScaling: true, // 当为 true 时，画布按 devicePixelRatio 缩放，以便在视网膜屏幕上更好地呈现
            // enablePointerEvents: true, // 启用该选项时，将使用 PointerEvent 而不是 MouseEvent。
            isDrawingMode: true, // 如果为真，画布上的鼠标事件（mousedown/mousemove/mouseup）会导致自由绘图。在 mousedown 之后，mousemove 创建一个形状，然后 mouseup 完成它并将 `fabric.Path` 的实例添加到画布上。
            selection: false, // 指示是否应启用组选择
            selectable: false, // 控件不能被选择，不会被操作
            skipTargetFind: true, // 整个画板元素不能被选中
        };
        canvas.current = new fabric.Canvas(canvasEl.current, options);

        // 设置自由绘画模式画笔类型为 铅笔类型
        canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
        // 设置自由绘画模式 画笔颜色与画笔线条大小
        canvas.current.freeDrawingBrush.color = 'red';
        canvas.current.freeDrawingBrush.width = 4;

        canvas.current.setDimensions({
            width: canvasBox.current.clientWidth,
            height: canvasBox.current.clientHeight,
        });

        const onMouseDown = (e) => {
            if (!['line', 'rect', 'circle', 'text'].includes(canvasAction)) {
                return;
            }
            const pointer = canvas.current.getPointer(e.e);
            mouseFrom.x = pointer.x;
            mouseFrom.y = pointer.y;

			console.log(222222222, e, pointer);
			
            if (canvasAction === 'text') {
				if (e.target && e.target.type === 'textbox') {
					textObject = e.target;
					// 文本打开编辑模式
					canvas.current.setActiveObject(textObject)
					textObject.enterEditing();
					// textObject.selected = false;
					// textObject.selectionEnd = 10;
					// 文本编辑框获取焦点
					// textObject.hiddenTextarea.focus();
					return;
				}
				drawText(e);
            } else {
				endDrawText();
            }
            // canvas.current.forEachObject((curObject, index, allObject) => {
            // 	console.log('forEachObject data:', curObject, index, allObject)
            // });
        };
        const onMouseMove = (e) => {
            if (!Object.keys(mouseFrom).length) {
                return;
            }
            // console.log('onMouseMove:', e)
            const pointer = canvas.current.getPointer(e.e);
            mouseTo.x = pointer.x;
            mouseTo.y = pointer.y;
            // eslint-disable-next-line default-case
            switch (canvasAction) {
                case 'line':
                    drawLine(e.absolutePointer);
                    break;
                case 'rect':
                    drawRect(e.absolutePointer);
                    break;
                case 'circle':
                    drawCircle(e.absolutePointer);
                    break;
            }
        };
        const onMouseUp = () => {
            mouseFrom = {};
            mouseTo = {};
            drawingObject = null;
        };

        canvas.current.on('mouse:down', onMouseDown);
        canvas.current.on('mouse:move', onMouseMove);
        canvas.current.on('mouse:up', onMouseUp);
        // canvas.current.on('path:created', (...data) => {
        // 	console.log('path:created:', data)
        // });
        // canvas.current.on('object:modified', (...data) => {
        // 	console.log('object:modified:', data)
        // });
        // canvas.current.on('before:render', (...data) => {
        // 	console.log('before:render:', data)
        // });
        // canvas.current.on('after:render', (...data) => {
        // 	console.log('after:render:', data)
        // });

        return () => {
            canvas.current.dispose();
            canvas.current.off('mouse:down', onMouseDown);
            canvas.current.off('mouse:move', onMouseMove);
            canvas.current.off('mouse:up', onMouseUp);
        };
    }, []);

    const setSelectState = ({ isSelect, isDrawingMode }) => {
        canvas.current.isDrawingMode = isDrawingMode;
        canvas.current.selection = isSelect;
        canvas.current.selectable = isSelect;
        canvas.current.skipTargetFind = !isSelect;
        canvas.current.forEachObject((curObject, index, allObject) => {
            curObject.selectable = isSelect;
            // console.log('forEachObject data:', curObject, index, allObject)
        });
    };

    const onClickPencil = () => {
        canvasAction = 'pencil';
        setSelectState({ isSelect: false, isDrawingMode: true });
        // 设置自由绘画模式画笔类型为 铅笔类型
        canvas.current.freeDrawingBrush = new fabric.PencilBrush(canvas.current);
        // canvas.current.freeDrawingBrush = new fabric.CircleBrush(canvas.current);
        // canvas.current.freeDrawingBrush = new fabric.PatternBrush(canvas.current);
        // canvas.current.freeDrawingBrush = new fabric.SprayBrush(canvas.current);
        // 设置自由绘画模式 画笔颜色与画笔线条大小
        canvas.current.freeDrawingBrush.color = 'red';
        canvas.current.freeDrawingBrush.width = 4;
    };

    const onClickSelect = () => {
        canvasAction = 'select';
        setSelectState({ isSelect: true, isDrawingMode: false });
    };

    const onClickEraser = () => {
        canvasAction = 'eraser';
        // 启用自由绘画模式
        setSelectState({ isSelect: false, isDrawingMode: true });
        // 自由绘画模式 画笔类型设置为 橡皮擦对象
        console.log('fabric:', fabric);
        canvas.current.freeDrawingBrush = new fabric.EraserBrush(canvas.current);
        // 设置橡皮擦大小
        canvas.current.freeDrawingBrush.width = 10;
    };

    const onClickLine = () => {
        canvasAction = 'line';
        setSelectState({ isSelect: false, isDrawingMode: false });
    };

    const onClickRect = () => {
        canvasAction = 'rect';
        setSelectState({ isSelect: false, isDrawingMode: false });
    };

    const onClickText = () => {
        canvasAction = 'text';
        setSelectState({ isSelect: false, isDrawingMode: false });
		// canvas.current.selection = isSelect;
        // canvas.current.selectable = isSelect;
        canvas.current.skipTargetFind = false;
    };

    const onClickCircle = () => {
        canvasAction = 'circle';
        setSelectState({ isSelect: false, isDrawingMode: false });
    };

    return (
        <div className="App">
            <div className="control">
                <Button className="control-btn" onClick={onClickPencil}>
                    铅笔
                </Button>
                <Button className="control-btn" onClick={onClickSelect}>
                    选择
                </Button>
                <Button className="control-btn" onClick={onClickLine}>
                    直线
                </Button>
                <Button className="control-btn" onClick={onClickRect}>
                    矩形
                </Button>
                <Button className="control-btn" onClick={onClickCircle}>
                    圆形
                </Button>
                <Button className="control-btn" onClick={onClickText}>
                    文字
                </Button>
                <Button className="control-btn" onClick={onClickEraser}>
                    橡皮
                </Button>
            </div>
			<div id="canvasBox" className="canvas-contianer" ref={canvasBox}>
				<div className="canvas-box">
					<canvas id="testCanvas" ref={canvasEl} />
				</div>
			</div>
        </div>
    );
}

export default App;
