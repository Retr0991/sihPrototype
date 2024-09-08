import React, { useState, useRef, useEffect, FC } from 'react';
import { Send } from 'lucide-react';

interface Message {
  text?: string;
  component?: JSX.Element;
  isBot: boolean;
}

interface BookingState {
  step: string;
  museum: string;
  date: string;
  timeSlot: string;
  tickets: number;
  userId: string;
}

const MuseumChatbot: FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Welcome to the Museum Reservation System! I'm here to help you book your visit. Would you like to make a reservation?", isBot: true }
  ]);
  const [input, setInput] = useState<string>('');
  const [bookingState, setBookingState] = useState<BookingState>({
    step: 'initial',
    museum: '',
    date: '',
    timeSlot: '',
    tickets: 0,
    userId: Math.random().toString(36).substr(2, 9),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages(prev => [...prev, { text: input, isBot: false }]);
    setInput('');
    processUserInput(input);
  };

  const botReply = (text: string) => {
    setMessages(prev => [...prev, { text, isBot: true }]);
  };

  const processUserInput = async (userInput: string) => {
    const lowerInput = userInput.toLowerCase();

    switch (bookingState.step) {
      case 'initial':
        if (lowerInput.includes('yes') || lowerInput.includes('sure') || lowerInput.includes('ok') || lowerInput.includes('yeah')) {
          setBookingState(prev => ({ ...prev, step: 'museum' }));
          botReply("Great! Which museum would you like to visit? We have the Louvre, Metropolitan Museum of Art, British Museum, and National Gallery available.");
        } else {
          botReply("I understand. If you change your mind, just let me know and I'll be happy to help you make a reservation.");
        }
        break;

      case 'museum':
        const museums = ['louvre', 'metropolitan museum of art', 'british museum', 'national gallery'];
        const foundMuseum = museums.find(museum => lowerInput.includes(museum));
        if (foundMuseum) {
          setBookingState(prev => ({ ...prev, museum: foundMuseum, step: 'date' }));
          botReply(`Excellent choice! The ${foundMuseum} is a fantastic museum. What date would you like to visit? (Please use the format MM/DD/YYYY)`);
        } else {
          botReply("I'm sorry, I didn't recognize that museum. Could you please choose from the Louvre, Metropolitan Museum of Art, British Museum, or National Gallery?");
        }
        break;

      case 'date':
        const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/;
        const dateMatch = lowerInput.match(dateRegex);
        if (dateMatch) {
          setBookingState(prev => ({ ...prev, date: dateMatch[0], step: 'time' }));
          botReply(`Got it, you'd like to visit on ${dateMatch[0]}. What time would you prefer? We have slots available every hour from 9:00 AM to 4:00 PM.`);
        } else {
          botReply("I'm sorry, I couldn't understand that date. Could you please provide it in the format MM/DD/YYYY?");
        }
        break;

      case 'time':
        const timeRegex = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
        const timeMatch = lowerInput.match(timeRegex);
        if (timeMatch) {
          const requestedTime = timeMatch[0];
          try {
            // Simulate fetching availability
            const availableTickets = await checkAvailability(bookingState.museum, bookingState.date, requestedTime);

            if (availableTickets > 0) {
              setBookingState(prev => ({ ...prev, timeSlot: requestedTime, step: 'tickets' }));
              botReply(`Great! We have tickets available for ${requestedTime}. How many tickets would you like to book?`);
            } else {
              const nextAvailableSlot = await findNextAvailableSlot(bookingState.museum, bookingState.date, requestedTime);
              if (nextAvailableSlot) {
                botReply(`I'm sorry, but the ${requestedTime} slot is not available. The next available slot is at ${nextAvailableSlot}. Would you like to book for this time instead? (Yes/No)`);
                setBookingState(prev => ({ ...prev, step: 'alternate_time', timeSlot: nextAvailableSlot }));
              } else {
                botReply(`I'm sorry, but there are no available slots for the rest of the day. Would you like to try a different date? (Yes/No)`);
                setBookingState(prev => ({ ...prev, step: 'retry_date' }));
              }
            }
          } catch (error) {
            console.error('Error checking availability:', error);
            botReply("I'm sorry, but there was an error checking availability. Please try again later.");
          }
        } else {
          botReply("I'm sorry, I couldn't understand that time. Could you please specify a time between 9:00 AM and 4:00 PM?");
        }
        break;

      case 'confirm':
        if (lowerInput.includes('yes')) {
          try {
            const success = await bookTickets(bookingState.userId, bookingState.museum, bookingState.date, bookingState.timeSlot, bookingState.tickets);

            if (success) {
              setBookingState(prev => ({ ...prev, step: 'complete' }));
              botReply("Wonderful! Your reservation is confirmed. You can now download your ticket:");
              generateTicketDownloadLink();
            } else {
              botReply("I apologize, but there was an error processing your reservation. Please try again later.");
              setBookingState(prev => ({ ...prev, step: 'initial' }));
            }
          } catch (error) {
            console.error('Error booking ticket:', error);
            botReply("I apologize, but there was an error processing your reservation. Please try again later.");
            setBookingState(prev => ({ ...prev, step: 'initial' }));
          }
        } else {
          botReply("I'm sorry, I didn't understand that. Could you please respond with Yes to confirm the booking or No to start over?");
        }
        break;

      default:
        botReply("I'm sorry, I'm not sure how to help with that. Would you like to make a new reservation?");
        setBookingState({ step: 'initial', museum: '', date: '', timeSlot: '', tickets: 0, userId: bookingState.userId });
    }
  };

  const checkAvailability = async (museum: string, date: string, timeSlot: string): Promise<number> => {
    // Simulated API call to check ticket availability using fetch
    try {
      const response = await fetch(`http://localhost:3000/api/check-availability?museum=${museum}&date=${date}&timeSlot=${timeSlot}`);
      const data = await response.json();
      return data.availableTickets || 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      return 0;
    }
  };

  const findNextAvailableSlot = async (museum: string, date: string, startTime: string): Promise<string | null> => {
    // Simulated API call to find the next available slot using fetch
    try {
      const response = await fetch(`http://localhost:3000/api/next-available-slot?museum=${museum}&date=${date}&startTime=${startTime}`);
      const data = await response.json();
      return data.nextAvailableSlot || null;
    } catch (error) {
      console.error('Error finding next available slot:', error);
      return null;
    }
  };

  const bookTickets = async (userId: string, museum: string, date: string, timeSlot: string, tickets: number): Promise<boolean> => {
    // Simulated API call to book tickets using fetch
    try {
      const response = await fetch('http://localhost:3000/api/book-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, museum, date, timeSlot, tickets }),
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error booking ticket:', error);
      return false;
    }
  };

  const generateTicketDownloadLink = () => {
    const ticketComponent = (
      <div className="ticket-container">
        <h3>Your ticket is ready!</h3>
        <a href="http://localhost:3000/api/download-ticket/ticketId" download="museum_ticket.pdf" className="download-button">
          Download Ticket
        </a>
      </div>
    );
    setMessages(prev => [...prev, { component: ticketComponent, isBot: true }]);
  };

  return (
    <div className="chatbot-container">
            <div className="header">
        <h1>Museum Reservation System</h1>
      </div>
      <div className="chat-area">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isBot ? 'bot' : 'user'}`}>
            {message.text && <p>{message.text}</p>}
            {message.component && message.component}
          </div>
        ))}
        <div ref={messagesEndRef} className="scroll-to-bottom" />
      </div>
      <div className="footer">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="input-box"
            placeholder="Type your message..."
          />
          <button onClick={handleSend} className="send-button">
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MuseumChatbot;

