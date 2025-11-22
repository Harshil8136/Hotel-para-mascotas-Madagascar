import { html, Icon } from '../../../globals.js';
import { Input } from '../../ui/Input.js';
import { Button } from '../../ui/Button.js';

export const ChatbotInput = ({ input, setInput, handleSend, placeholder }) => {
    return html`
    <div className="p-4 border-t border-border">
      <div className="flex gap-2">
        <${Input}
          value=${input}
          onChange=${(e) => setInput(e.target.value)}
          onKeyPress=${(e) => e.key === "Enter" && handleSend()}
          placeholder=${placeholder}
          className="flex-1"
        />
        <${Button} size="icon" onClick=${() => handleSend()} disabled=${!input.trim()}>
          <${Icon} name="Send" className="w-4 h-4" />
        <//>
      </div>
    </div>
  `;
};
