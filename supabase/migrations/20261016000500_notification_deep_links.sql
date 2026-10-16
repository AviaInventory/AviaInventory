-- AviaInventory: notification links open the exact section that needs attention.
--
-- The RFQ and quote pages are long, so a link to the page alone left users at the top:
--   new RFQ      -> supplier RFQ page, quote form      (#submit-quote)
--   new quote    -> buyer RFQ page, received quotations (#quotations)
--   new message  -> supplier RFQ page, conversation     (#buyer-conversation)
--                   (buyer links already end in #supplier-conversation)
-- Order, quote-declined and verification links already point at their own pages.

create or replace function public.notify_new_rfq()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_part text := public.rfq_part_label(new.id);
  v_message text := format('A buyer requested %s × %s. Review it and send your quotation.', coalesce(new.quantity, 1), v_part);
begin
  if new.supplier_id is not null then
    perform public.notify_user(new.supplier_id, 'rfq', 'rfq', 'New RFQ received', v_message, '/supplier/rfqs/' || new.id || '#submit-quote');
  else
    insert into public.notifications (user_id, type, title, message, link)
    select s.id, 'rfq', 'New open RFQ', v_message, '/supplier/rfqs/' || new.id || '#submit-quote'
    from public.suppliers s
    where s.id <> new.buyer_id
      and public.wants_notification(s.id, 'rfq');
  end if;
  return new;
end;
$$;

create or replace function public.notify_quote_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company text;
  v_part text := public.rfq_part_label(new.rfq_id);
begin
  if tg_op = 'INSERT' then
    select s.company_name into v_company from public.suppliers s where s.id = new.supplier_id;
    perform public.notify_user(
      new.buyer_id, 'quote', 'quotes', 'New quotation received',
      format('%s quoted %s %s for %s.', coalesce(v_company, 'A supplier'), coalesce(new.currency, ''), new.unit_price, v_part),
      '/buyer/rfqs/' || new.rfq_id || '#quotations'
    );
  elsif new.status is distinct from old.status and new.status = 'Rejected' then
    perform public.notify_user(
      new.supplier_id, 'quote', 'quotes', 'Quotation not selected',
      format('The buyer did not select your quotation for %s.', v_part),
      '/supplier/quotes'
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_link text;
  v_sender text;
begin
  if new.recipient_id is null or new.recipient_id = new.sender_id then
    return new;
  end if;

  select r.buyer_id into v_buyer from public.rfqs r where r.id = new.rfq_id;
  v_link := case
    when new.rfq_id is null then
      case when exists (select 1 from public.suppliers s where s.id = new.recipient_id) then '/supplier/messages' else '/buyer/messages' end
    when v_buyer = new.recipient_id then '/buyer/rfqs/' || new.rfq_id || '#supplier-conversation'
    else '/supplier/rfqs/' || new.rfq_id || '#buyer-conversation'
  end;

  select coalesce(p.company_name, p.full_name) into v_sender from public.profiles p where p.id = new.sender_id;

  update public.notifications
  set message = left(new.message, 200), created_at = now()
  where user_id = new.recipient_id and type = 'message' and link = v_link and not is_read;

  if not found then
    perform public.notify_user(new.recipient_id, 'message', 'messages',
      'New message from ' || coalesce(v_sender, 'a marketplace user'), left(new.message, 200), v_link);
  end if;
  return new;
end;
$$;

-- Bring existing notifications in line.
update public.notifications
set link = link || '#submit-quote'
where type = 'rfq' and link like '/supplier/rfqs/%' and link not like '%#%';

update public.notifications
set link = link || '#quotations'
where type = 'quote' and link like '/buyer/rfqs/%' and link not like '%#%';

update public.notifications
set link = link || '#buyer-conversation'
where type = 'message' and link like '/supplier/rfqs/%' and link not like '%#%';

revoke execute on function public.notify_new_rfq() from public, anon, authenticated;
revoke execute on function public.notify_quote_events() from public, anon, authenticated;
revoke execute on function public.notify_new_message() from public, anon, authenticated;
