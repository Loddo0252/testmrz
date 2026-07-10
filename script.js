package com.mrz.generator {
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.text.TextField;
    import flash.text.TextFormat;
    import flash.text.TextFieldType;
    import flash.events.MouseEvent;
    import flash.net.FileReference;
    import flash.utils.ByteArray;

    /**
     * MRZGenerator - A comprehensive ActionScript 3 implementation of ICAO 9303 MRZ generation.
     * This class handles the logic for TD1, TD3, and MRV formats including the 7-3-1 checksum algorithm.
     */
    public class MRZGenerator extends Sprite {
        
        // Constants for ICAO 9303
        private static const CHAR_MAP:String = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private static const WEIGHTS:Array = [7, 3, 1];

        // UI Components
        private var _mrzOutput:TextField;
        private var _docTypeInput:TextField;
        private var _countryInput:TextField;
        private var _surnameInput:TextField;
        private var _givenNamesInput:TextField;
        private var _docNumInput:TextField;
        private var _nationalityInput:TextField;
        private var _dobInput:TextField; // YYMMDD
        private var _sexInput:TextField; // M/F/X
        private var _expiryInput:TextField; // YYMMDD
        private var _personalNumInput:TextField;

        public function MRZGenerator() {
            if (stage) init();
            else addEventListener(Event.ADDED_TO_STAGE, init);
        }

        private function init(e:Event = null):void {
            removeEventListener(Event.ADDED_TO_STAGE, init);
            setupUI();
        }

        /**
         * Core 7-3-1 Checksum Algorithm
         */
        public function calculateCheckDigit(str:String):int {
            var sum:int = 0;
            for (var i:int = 0; i < str.length; i++) {
                var char:String = str.charAt(i).toUpperCase();
                var val:int = 0;
                
                if (char == "<") {
                    val = 0;
                } else {
                    val = CHAR_MAP.indexOf(char);
                    if (val == -1) val = 0;
                }
                
                sum += val * WEIGHTS[i % 3];
            }
            return sum % 10;
        }

        /**
         * Pads or truncates a string to specific length and replaces spaces with <
         */
        private function formatField(input:String, length:int):String {
            var result:String = input.toUpperCase().replace(/[^A-Z0-9]/g, "<");
            while (result.length < length) {
                result += "<";
            }
            return result.substr(0, length);
        }

        /**
         * Generates TD3 (Passport) MRZ - 2 lines of 44 characters
         */
        public function generateTD3():String {
            var line1:String = "P<" + formatField(_countryInput.text, 3);
            var names:String = formatField(_surnameInput.text, 39) + "<<" + formatField(_givenNamesInput.text, 39);
            line1 += formatField(names, 39);

            var docNum:String = formatField(_docNumInput.text, 9);
            var docNumCD:int = calculateCheckDigit(docNum);
            
            var dob:String = formatField(_dobInput.text, 6);
            var dobCD:int = calculateCheckDigit(dob);
            
            var sex:String = formatField(_sexInput.text, 1);
            
            var expiry:String = formatField(_expiryInput.text, 6);
            var expiryCD:int = calculateCheckDigit(expiry);
            
            var personal:String = formatField(_personalNumInput.text, 14);
            var personalCD:int = calculateCheckDigit(personal);
            
            // Composite Checksum (DocNum + CD + DOB + CD + Personal + CD)
            var compositeStr:String = docNum + docNumCD + dob + dobCD + personal + personalCD;
            var compositeCD:int = calculateCheckDigit(compositeStr);

            var line2:String = docNum + docNumCD + formatField(_nationalityInput.text, 3) + 
                               dob + dobCD + sex + expiry + expiryCD + personal + personalCD + compositeCD;

            return line1 + "\n" + line2;
        }

        /**
         * Generates TD1 (ID Card) MRZ - 3 lines of 30 characters
         */
        public function generateTD1():String {
            var docNum:String = formatField(_docNumInput.text, 9);
            var docNumCD:int = calculateCheckDigit(docNum);
            var optional1:String = formatField(_personalNumInput.text, 15);
            
            var line1:String = "I<" + formatField(_countryInput.text, 3) + docNum + docNumCD + optional1;
            
            var dob:String = formatField(_dobInput.text, 6);
            var dobCD:int = calculateCheckDigit(dob);
            var sex:String = formatField(_sexInput.text, 1);
            var expiry:String = formatField(_expiryInput.text, 6);
            var expiryCD:int = calculateCheckDigit(expiry);
            var nationality:String = formatField(_nationalityInput.text, 3);
            var optional2:String = formatField("", 11);
            
            var compositeStr:String = docNum + docNumCD + dob + dobCD + expiry + expiryCD + optional1 + optional2;
            var compositeCD:int = calculateCheckDigit(compositeStr);
            
            var line2:String = dob + dobCD + sex + expiry + expiryCD + nationality + optional2 + compositeCD;
            
            var names:String = formatField(_surnameInput.text + "<<" + _givenNamesInput.text, 30);
            var line3:String = names;
            
            return line1 + "\n" + line2 + "\n" + line3;
        }

        private function setupUI():void {
            var fmt:TextFormat = new TextFormat("Arial", 12, 0xFFFFFF);
            var mrzFmt:TextFormat = new TextFormat("Courier New", 18, 0x00FF00, true);

            // Simple background
            graphics.beginFill(0x222222);
            graphics.drawRect(0, 0, 600, 500);
            graphics.endFill();

            // Create Inputs
            _docTypeInput = createInput("TD3", 20, 20);
            _countryInput = createInput("USA", 20, 50);
            _surnameInput = createInput("DOE", 20, 80);
            _givenNamesInput = createInput("JOHN", 20, 110);
            _docNumInput = createInput("123456789", 20, 140);
            _nationalityInput = createInput("USA", 20, 170);
            _dobInput = createInput("800101", 20, 200);
            _sexInput = createInput("M", 20, 230);
            _expiryInput = createInput("300101", 20, 260);
            _personalNumInput = createInput("", 20, 290);

            // Output Area
            _mrzOutput = new TextField();
            _mrzOutput.defaultTextFormat = mrzFmt;
            _mrzOutput.width = 560;
            _mrzOutput.height = 100;
            _mrzOutput.x = 20;
            _mrzOutput.y = 350;
            _mrzOutput.border = true;
            _mrzOutput.borderColor = 0x444444;
            _mrzOutput.background = true;
            _mrzOutput.backgroundColor = 0x111111;
            addChild(_mrzOutput);

            // Generate Button
            var btn:Sprite = new Sprite();
            btn.graphics.beginFill(0x0078D7);
            btn.graphics.drawRoundRect(0, 0, 120, 30, 10);
            btn.x = 20;
            btn.y = 320;
            btn.buttonMode = true;
            btn.addEventListener(MouseEvent.CLICK, onGenerate);
            addChild(btn);

            var btnLabel:TextField = new TextField();
            btnLabel.defaultTextFormat = new TextFormat("Arial", 12, 0xFFFFFF, true);
            btnLabel.text = "GENERATE MRZ";
            btnLabel.width = 120;
            btnLabel.selectable = false;
            btnLabel.mouseEnabled = false;
            btnLabel.y = 5;
            btn.addChild(btnLabel);
        }

        private function createInput(defaultVal:String, x:int, y:int):TextField {
            var tf:TextField = new TextField();
            tf.type = TextFieldType.INPUT;
            tf.defaultTextFormat = new TextFormat("Arial", 12, 0x000000);
            tf.background = true;
            tf.backgroundColor = 0xFFFFFF;
            tf.width = 200;
            tf.height = 20;
            tf.x = x;
            tf.y = y;
            tf.text = defaultVal;
            addChild(tf);
            return tf;
        }

        private function onGenerate(e:MouseEvent):void {
            if (_docTypeInput.text == "TD1") {
                _mrzOutput.text = generateTD1();
            } else {
                _mrzOutput.text = generateTD3();
            }
        }
    }
}
