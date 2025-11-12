import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MathCaptchaProps {
  onValidate: (isValid: boolean, challenge: string, response: string) => void;
  className?: string;
}

export function MathCaptcha({ onValidate, className = "" }: MathCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState<"+" | "-" | "*">("+");
  const [userAnswer, setUserAnswer] = useState("");
  const [isValid, setIsValid] = useState(false);

  const generateChallenge = () => {
    const operators: Array<"+" | "-" | "*"> = ["+", "-", "*"];
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    const newOperator = operators[Math.floor(Math.random() * operators.length)];

    setNum1(newNum1);
    setNum2(newNum2);
    setOperator(newOperator);
    setUserAnswer("");
    setIsValid(false);
    onValidate(false, "", "");
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const calculateAnswer = () => {
    switch (operator) {
      case "+":
        return num1 + num2;
      case "-":
        return num1 - num2;
      case "*":
        return num1 * num2;
      default:
        return 0;
    }
  };

  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    
    const correctAnswer = calculateAnswer();
    const userNum = parseInt(value, 10);
    const valid = !isNaN(userNum) && userNum === correctAnswer;
    
    setIsValid(valid);
    
    const challenge = `${num1}${operator}${num2}`;
    onValidate(valid, challenge, value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="captcha-input" className="text-sm font-medium">
        Vérification de sécurité
      </Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md font-mono text-lg">
            <span>{num1}</span>
            <span className="text-primary font-bold">{operator}</span>
            <span>{num2}</span>
            <span>=</span>
            <span className="text-muted-foreground">?</span>
          </div>
          <Input
            id="captcha-input"
            data-testid="input-captcha"
            type="number"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Réponse"
            className={`w-24 ${isValid ? "border-green-500" : ""}`}
            required
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={generateChallenge}
          data-testid="button-refresh-captcha"
          title="Nouveau calcul"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      {userAnswer && !isValid && (
        <p className="text-sm text-destructive" data-testid="text-captcha-error">
          Réponse incorrecte. Veuillez réessayer.
        </p>
      )}
      {isValid && (
        <p className="text-sm text-green-600 dark:text-green-400" data-testid="text-captcha-success">
          ✓ Vérification réussie
        </p>
      )}
    </div>
  );
}
