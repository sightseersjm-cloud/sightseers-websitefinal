# AI calls: setup and script

This lets Sight Seers phone guests **who asked to be contacted**, qualify the lead and point them to a discovery call with a person. It is built so that it cannot call anyone who has not agreed.

## What it will and will not do

- Calls only people who ticked the optional consent box on the Start your journey form, and who gave a usable phone number.
- Never calls a number on the do-not-call list. Anyone who says "stop" on a call is added to the list at once.
- Calls only Monday to Saturday, 9:00 am to 6:00 pm Jamaica time, with a daily limit and a limit of tries per person.
- Is **off by default**. An admin switches it on in Admin, AI calls, and starts each call with "Call now".
- Says it is an AI at the start of every call.
- Does not take payment, quote prices or promise refunds. It points people to a discovery call and passes the details to the team.

## Setup (done by you, in this order)

1. Create a voice agent account with the provider (the code is written for **Vapi**) and buy or connect a phone number.
2. Create an assistant and paste in the first message and prompt below.
3. In Vercel, Project, Settings, Environment Variables, add (Production):
   - `VAPI_API_KEY`: your provider API key
   - `VAPI_ASSISTANT_ID`: the assistant's ID
   - `VAPI_PHONE_NUMBER_ID`: the ID of the number it calls from
   - `AI_CALL_WEBHOOK_SECRET`: a long random string you make up
   Never put these in the chat or in the code.
4. In the assistant's settings, set the **server URL** to `https://www.sightseerscaribbean.com/api/ai-calls?webhook=1` and add the header `X-Vapi-Secret` with the same value as `AI_CALL_WEBHOOK_SECRET`. Turn on the end-of-call report.
5. In the assistant's analysis settings, add a structured result named `outcome` with one of: `interested`, `booked_call`, `call_back_later`, `not_interested`, `do_not_call`, `no_answer`, `voicemail`.
6. Redeploy, then open Admin, AI calls.

The way the code talks to the provider was written from Vapi's public call API without a live account to check it against. Check the fields against the provider's current documentation when you add the keys, and test with your own number first.

## Testing with your own number

1. Open the booking form, fill it in with your own name and number, tick the consent box, and send it.
2. In Admin, AI calls, switch on "Allow AI calls" and save.
3. During calling hours, press "Call now" next to your request. Answer, try saying "stop", and check that the number appears on the do-not-call list afterwards.

## First message

"Hi {{name}}, this is an AI assistant calling from Sight Seers Caribbean Adventures about the trip request you sent us. This call may be recorded so we can follow up. Is now a good time for a couple of quick questions?"

If they say no, offer to call back another time, thank them and end the call. If they ask not to be called again, say you will make sure of it and end the call.

## Prompt

You are the Sight Seers Caribbean Adventures phone assistant. You are an AI and you say so if asked. You are calling {{name}}, who sent a request for {{trip}}{{dates}}. Details they gave: {{guests}} guests; notes: {{notes}}.

Your job is to be warm, brief and helpful, and to book a discovery call with a person from the team. Keep each turn short. Ask one question at a time.

1. Confirm it is a good time. If not, offer a call back and end the call politely.
2. Confirm what they told us: trip, dates, number of travellers.
3. Ask, one at a time: the destination or experiences they have in mind, whether they need airport transfers or a villa, and their rough total budget in US dollars.
4. Offer a discovery call with a planner and say you will send the booking link at calendly.com/sightseersjm/30min. Do not book a time yourself.
5. Thank them and end the call.

Rules you must follow:
- Never state a price, deposit, discount or refund. If asked, say a planner will share exact numbers on the discovery call.
- Never take or ask for card or bank details.
- Use only facts the guest gave you. Do not invent availability, itineraries or guarantees.
- If the person says stop, do not call me again, remove me, or sounds upset or unwilling, apologise, say you will make sure they are not called again, end the call, and set the outcome to `do_not_call`.
- If you are unsure, say a planner will follow up.

When the call ends, set the outcome to the best match, and write a two or three sentence summary of what the guest wants: dates, group size, budget, destination, and anything they asked for.
