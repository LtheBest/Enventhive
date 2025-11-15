/**
 * Email Service - SendGrid Integration
 * Handles all email communications for TEAMMOVE platform
 */

import sgMail from '@sendgrid/mail';
import type { Company, Event, Participant, Transaction, Plan } from '@/shared/schema';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'erictchuisseu@yahoo.fr';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!SENDGRID_API_KEY) {
  console.warn('⚠️ SENDGRID_API_KEY is not configured - emails will not be sent');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized successfully');
}

/**
 * Send email helper with error handling
 */
async function sendEmail(msg: sgMail.MailDataRequired): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️ Email not sent - SendGrid not configured:', msg.to);
    return false;
  }

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${msg.to}`);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid email error:', error?.response?.body || error.message);
    return false;
  }
}

/**
 * Email Templates
 */

interface WelcomeEmailData {
  company: Company;
  userEmail: string;
  userFirstName?: string;
  planName: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const { company, userEmail, userFirstName, planName } = data;

  const msg: sgMail.MailDataRequired = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `Bienvenue chez TEAMMOVE - ${company.name}`,
    text: `Bonjour ${userFirstName || ''},

Bienvenue sur TEAMMOVE ! 🎉

Votre compte entreprise a été créé avec succès pour ${company.name}.

Plan sélectionné : ${planName}

Vous pouvez maintenant vous connecter et commencer à gérer vos événements et covoiturages :
${BASE_URL}/login

Vos identifiants :
- Email : ${userEmail}

Besoin d'aide ? Notre équipe est là pour vous accompagner.

Cordialement,
L'équipe TEAMMOVE`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue chez TEAMMOVE</h1>
    </div>
    <div class="content">
      <p>Bonjour ${userFirstName || ''},</p>
      
      <p>Votre compte entreprise a été créé avec succès pour <strong>${company.name}</strong>.</p>
      
      <div class="info-box">
        <strong>Plan sélectionné :</strong> ${planName}
      </div>
      
      <p>Vous pouvez maintenant accéder à votre tableau de bord pour :</p>
      <ul>
        <li>✅ Créer et gérer vos événements</li>
        <li>🚗 Organiser des covoiturages intelligents</li>
        <li>👥 Inviter et gérer vos participants</li>
        <li>📊 Suivre vos statistiques en temps réel</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${BASE_URL}/login" class="button">Accéder à mon compte</a>
      </div>
      
      <div class="info-box">
        <strong>Vos identifiants :</strong><br>
        Email : ${userEmail}
      </div>
      
      <p>Besoin d'aide ? Notre équipe est là pour vous accompagner.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE - Plateforme de gestion d'événements et covoiturage</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

interface EventCreatedEmailData {
  company: Company;
  event: Event;
  creatorEmail: string;
}

export async function sendEventCreatedEmail(data: EventCreatedEmailData): Promise<boolean> {
  const { company, event, creatorEmail } = data;
  const eventDate = new Date(event.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const msg: sgMail.MailDataRequired = {
    to: creatorEmail,
    from: FROM_EMAIL,
    subject: `Événement créé avec succès : ${event.title}`,
    text: `Bonjour,

Votre événement "${event.title}" a été créé avec succès !

Détails :
- Date : ${eventDate}
- Lieu : ${event.location}, ${event.city}
${event.description ? `- Description : ${event.description}` : ''}

Lien de partage : ${BASE_URL}/events/${event.id}/public
Code QR : Disponible dans votre tableau de bord

Vous pouvez maintenant inviter des participants et gérer les covoiturages.

Accéder à l'événement : ${BASE_URL}/events/${event.id}

Cordialement,
L'équipe TEAMMOVE`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .event-card { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Événement créé avec succès</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      
      <p>Votre événement a été créé avec succès !</p>
      
      <div class="event-card">
        <h2 style="margin-top: 0; color: #10b981;">📅 ${event.title}</h2>
        <p><strong>📍 Lieu :</strong> ${event.location}, ${event.city}</p>
        <p><strong>🕐 Date :</strong> ${eventDate}</p>
        ${event.description ? `<p><strong>📝 Description :</strong> ${event.description}</p>` : ''}
        ${event.maxParticipants ? `<p><strong>👥 Places :</strong> ${event.maxParticipants} participants max</p>` : ''}
      </div>
      
      <div style="text-align: center;">
        <a href="${BASE_URL}/events/${event.id}" class="button">Gérer l'événement</a>
      </div>
      
      <p><strong>Prochaines étapes :</strong></p>
      <ul>
        <li>✉️ Invitez des participants par email</li>
        <li>🚗 Ajoutez des véhicules pour le covoiturage</li>
        <li>🔗 Partagez le lien public : <a href="${BASE_URL}/events/${event.id}/public">${BASE_URL}/events/${event.id}/public</a></li>
      </ul>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE - ${company.name}</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

interface ParticipantInvitationData {
  company: Company;
  event: Event;
  participant: Participant;
  invitationToken: string;
}

export async function sendParticipantInvitation(data: ParticipantInvitationData): Promise<boolean> {
  const { company, event, participant, invitationToken } = data;
  const eventDate = new Date(event.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const acceptUrl = `${BASE_URL}/invitations/accept?token=${invitationToken}`;
  const declineUrl = `${BASE_URL}/invitations/decline?token=${invitationToken}`;

  const msg: sgMail.MailDataRequired = {
    to: participant.email,
    from: FROM_EMAIL,
    subject: `Invitation : ${event.title} - ${company.name}`,
    text: `Bonjour ${participant.firstName},

${company.name} vous invite à participer à l'événement :

${event.title}

Date : ${eventDate}
Lieu : ${event.location}, ${event.city}

${event.description || ''}

Un covoiturage pourra être organisé pour faciliter votre participation.

Accepter l'invitation : ${acceptUrl}
Décliner : ${declineUrl}

Cordialement,
${company.name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .button-accept { background: #10b981; }
    .button-decline { background: #ef4444; }
    .event-card { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Vous êtes invité(e)</h1>
      <p style="margin: 0; font-size: 18px;">${company.name}</p>
    </div>
    <div class="content">
      <p>Bonjour ${participant.firstName},</p>
      
      <p><strong>${company.name}</strong> vous invite à participer à l'événement suivant :</p>
      
      <div class="event-card">
        <h2 style="margin-top: 0; color: #3b82f6;">📅 ${event.title}</h2>
        <p><strong>📍 Lieu :</strong> ${event.location}, ${event.city}</p>
        <p><strong>🕐 Date :</strong> ${eventDate}</p>
        ${event.description ? `<p><strong>📝 Description :</strong> ${event.description}</p>` : ''}
      </div>
      
      <p>🚗 <strong>Covoiturage disponible !</strong> Un système de covoiturage intelligent sera mis en place pour faciliter votre participation.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" class="button button-accept">✅ Accepter l'invitation</a>
        <a href="${declineUrl}" class="button button-decline">❌ Décliner</a>
      </div>
      
      <p style="font-size: 14px; color: #777;">Vous pourrez préciser si vous êtes conducteur ou passager après avoir accepté l'invitation.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE - ${company.name}</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

interface PaymentFailedEmailData {
  company: Company;
  userEmail: string;
  planName: string;
  amount: string;
  retryUrl: string;
}

export async function sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<boolean> {
  const { company, userEmail, planName, amount, retryUrl } = data;

  const msg: sgMail.MailDataRequired = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `Échec du paiement - ${company.name}`,
    text: `Bonjour,

Nous n'avons pas pu traiter votre paiement pour le plan ${planName}.

Montant : ${amount}

Votre compte a été automatiquement basculé sur le plan Découverte (gratuit) en attendant.

Vous pouvez réessayer le paiement à tout moment : ${retryUrl}

Si le problème persiste, vérifiez vos informations bancaires ou contactez-nous.

Cordialement,
L'équipe TEAMMOVE`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning-box { background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
    .info-box { background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Échec du paiement</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      
      <p>Nous n'avons pas pu traiter votre paiement pour le plan <strong>${planName}</strong>.</p>
      
      <div class="warning-box">
        <strong>💳 Montant :</strong> ${amount}<br>
        <strong>📦 Plan :</strong> ${planName}
      </div>
      
      <div class="info-box">
        <strong>✅ Pas d'inquiétude !</strong><br>
        Votre compte a été automatiquement basculé sur le <strong>plan Découverte (gratuit)</strong> en attendant.<br>
        Vous pouvez continuer à utiliser TEAMMOVE avec les fonctionnalités de base.
      </div>
      
      <p><strong>Que faire maintenant ?</strong></p>
      <ul>
        <li>🔄 Vérifiez vos informations bancaires</li>
        <li>💳 Assurez-vous d'avoir les fonds suffisants</li>
        <li>📞 Contactez votre banque si nécessaire</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${retryUrl}" class="button">Réessayer le paiement</a>
      </div>
      
      <p>Si le problème persiste, n'hésitez pas à nous contacter.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE - ${company.name}</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

interface EventReminderEmailData {
  company: Company;
  event: Event;
  participant: Participant;
  hoursUntilEvent: number;
}

export async function sendEventReminderEmail(data: EventReminderEmailData): Promise<boolean> {
  const { company, event, participant, hoursUntilEvent } = data;
  const eventDate = new Date(event.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const timeText = hoursUntilEvent < 24 
    ? `dans ${hoursUntilEvent} heures`
    : `dans ${Math.round(hoursUntilEvent / 24)} jours`;

  const msg: sgMail.MailDataRequired = {
    to: participant.email,
    from: FROM_EMAIL,
    subject: `Rappel : ${event.title} ${timeText}`,
    text: `Bonjour ${participant.firstName},

Rappel : L'événement "${event.title}" approche !

Date : ${eventDate} (${timeText})
Lieu : ${event.location}, ${event.city}

${participant.role === 'driver' ? '🚗 Vous êtes conducteur pour cet événement.' : '👤 Vous êtes passager pour cet événement.'}

Voir les détails : ${BASE_URL}/events/${event.id}/public

Cordialement,
${company.name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .event-card { background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 5px; }
    .role-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .driver { background: #10b981; color: white; }
    .passenger { background: #3b82f6; color: white; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Rappel d'événement</h1>
      <p style="margin: 0; font-size: 18px;">${timeText}</p>
    </div>
    <div class="content">
      <p>Bonjour ${participant.firstName},</p>
      
      <p>Nous vous rappelons que l'événement suivant aura lieu <strong>${timeText}</strong> :</p>
      
      <div class="event-card">
        <h2 style="margin-top: 0; color: #f59e0b;">📅 ${event.title}</h2>
        <p><strong>📍 Lieu :</strong> ${event.location}, ${event.city}</p>
        <p><strong>🕐 Date :</strong> ${eventDate}</p>
        ${event.description ? `<p><strong>📝 Description :</strong> ${event.description}</p>` : ''}
        
        <div>
          <span class="role-badge ${participant.role === 'driver' ? 'driver' : 'passenger'}">
            ${participant.role === 'driver' ? '🚗 Conducteur' : '👤 Passager'}
          </span>
        </div>
      </div>
      
      ${participant.role === 'driver' 
        ? '<p>💡 <strong>N\'oubliez pas :</strong> Vérifiez le nombre de passagers et préparez votre véhicule.</p>'
        : '<p>💡 <strong>N\'oubliez pas :</strong> Votre conducteur compte sur vous !</p>'}
      
      <div style="text-align: center;">
        <a href="${BASE_URL}/events/${event.id}/public" class="button">Voir les détails</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE - ${company.name}</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

interface NoDriverAlertEmailData {
  company: Company;
  event: Event;
  organizerEmail: string;
  passengersCount: number;
}

export async function sendNoDriverAlertEmail(data: NoDriverAlertEmailData): Promise<boolean> {
  const { company, event, organizerEmail, passengersCount } = data;
  const eventDate = new Date(event.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const msg: sgMail.MailDataRequired = {
    to: organizerEmail,
    from: FROM_EMAIL,
    subject: `⚠️ Alerte : Aucun conducteur pour "${event.title}"`,
    text: `Bonjour,

⚠️ ALERTE COVOITURAGE

L'événement "${event.title}" a ${passengersCount} passager(s) confirmé(s) mais aucun conducteur enregistré.

Date de l'événement : ${eventDate}
Lieu : ${event.location}, ${event.city}

Action recommandée :
- Contactez les participants pour identifier des conducteurs potentiels
- Ajoutez manuellement des véhicules si nécessaire

Gérer l'événement : ${BASE_URL}/events/${event.id}

Cordialement,
L'équipe TEAMMOVE`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .alert-box { background: #fef2f2; padding: 20px; border: 2px solid #ef4444; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ ALERTE COVOITURAGE</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      
      <div class="alert-box">
        <h3 style="margin-top: 0; color: #ef4444;">🚨 Aucun conducteur enregistré</h3>
        <p><strong>Événement :</strong> ${event.title}</p>
        <p><strong>Date :</strong> ${eventDate}</p>
        <p><strong>Lieu :</strong> ${event.location}, ${event.city}</p>
        <p><strong>👥 Passagers confirmés :</strong> ${passengersCount}</p>
      </div>
      
      <p><strong>⚠️ Problème :</strong> Vous avez ${passengersCount} passager(s) confirmé(s) mais aucun conducteur n'a été enregistré pour cet événement.</p>
      
      <p><strong>Actions recommandées :</strong></p>
      <ul>
        <li>📞 Contactez les participants pour identifier des conducteurs potentiels</li>
        <li>🚗 Ajoutez manuellement des véhicules depuis votre tableau de bord</li>
        <li>📧 Envoyez une relance aux participants</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${BASE_URL}/events/${event.id}" class="button">Gérer l'événement</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE - ${company.name}</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

interface SupportNotificationEmailData {
  supportRequestId: string;
  companyName: string;
  subject: string;
  message: string;
  requestType: string;
  isReply?: boolean;
  senderType?: 'admin' | 'company';
  recipientEmail?: string;
}

export async function sendSupportNotificationEmail(data: SupportNotificationEmailData): Promise<boolean> {
  const { supportRequestId, companyName, subject, message, requestType, isReply, senderType, recipientEmail } = data;

  // Determine recipient based on sender type
  const to = isReply 
    ? (senderType === 'admin' ? recipientEmail : FROM_EMAIL) // If admin replies, send to company, else send to admin
    : FROM_EMAIL; // New requests always go to admin

  const isNewRequest = !isReply;
  const requestTypeLabels: Record<string, string> = {
    quote_request: 'Demande de devis',
    plan_upgrade: 'Upgrade de plan',
    technical_support: 'Support technique',
    general_inquiry: 'Question générale',
  };

  const requestTypeLabel = requestTypeLabels[requestType] || requestType;

  const msg: sgMail.MailDataRequired = {
    to: to!,
    from: FROM_EMAIL,
    subject: isNewRequest 
      ? `[Support] Nouvelle demande : ${subject}` 
      : `[Support] Nouveau message : ${subject}`,
    text: isNewRequest ? `
Nouvelle demande de support reçue

Entreprise : ${companyName}
Type : ${requestTypeLabel}
Sujet : ${subject}

Message :
${message}

Accéder à la demande : ${BASE_URL}/admin/support/${supportRequestId}

---
TEAMMOVE Support System
    ` : `
Nouveau message sur la demande de support

${senderType === 'admin' ? 'Réponse de l\'administrateur' : `Message de ${companyName}`}
Sujet : ${subject}

Message :
${message}

Accéder à la conversation : ${BASE_URL}/${senderType === 'admin' ? 'support' : 'admin/support'}/${supportRequestId}

---
TEAMMOVE Support System
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isNewRequest ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; border-radius: 5px; }
    .message-box { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #ddd6fe; color: #6d28d9; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isNewRequest ? '📩 Nouvelle demande de support' : '💬 Nouveau message'}</h1>
    </div>
    <div class="content">
      ${isNewRequest ? `
        <p><strong>Une nouvelle demande de support a été reçue.</strong></p>
        
        <div class="info-box">
          <p><strong>🏢 Entreprise :</strong> ${companyName}</p>
          <p><strong>📋 Type :</strong> <span class="badge">${requestTypeLabel}</span></p>
          <p><strong>✉️ Sujet :</strong> ${subject}</p>
        </div>
        
        <div class="message-box">
          <p><strong>Message :</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${BASE_URL}/admin/support/${supportRequestId}" class="button">Accéder à la demande</a>
        </div>
      ` : `
        <p><strong>${senderType === 'admin' ? '👨‍💼 L\'administrateur a répondu' : `📧 ${companyName} a envoyé un message`}</strong></p>
        
        <div class="info-box">
          <p><strong>✉️ Sujet :</strong> ${subject}</p>
          <p><strong>📋 Type :</strong> <span class="badge">${requestTypeLabel}</span></p>
        </div>
        
        <div class="message-box">
          <p><strong>Nouveau message :</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${BASE_URL}/${senderType === 'admin' ? 'support' : 'admin/support'}/${supportRequestId}" class="button">Voir la conversation</a>
        </div>
      `}
      
      <p style="margin-top: 30px; font-size: 14px; color: #777;">
        ${isNewRequest 
          ? 'Veuillez traiter cette demande dans les plus brefs délais.' 
          : 'Connectez-vous pour continuer la conversation.'}
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE Support System</p>
      <p>Cet email est envoyé automatiquement par le système de support TEAMMOVE.</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

interface DriverAvailableEmailData {
  passengerEmail: string;
  passengerFirstName: string;
  event: Event;
  company: Company;
  driverFirstName: string;
  driverLastName: string;
  departureLocation: string;
  departureTime: Date;
  availableSeats: number;
}

export async function sendDriverAvailableEmail(data: DriverAvailableEmailData): Promise<boolean> {
  const { passengerEmail, passengerFirstName, event, company, driverFirstName, driverLastName, departureLocation, departureTime, availableSeats } = data;
  
  const eventDate = new Date(event.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const departureTimeFormatted = new Date(departureTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const msg: sgMail.MailDataRequired = {
    to: passengerEmail,
    from: FROM_EMAIL,
    subject: `🚗 Un conducteur est disponible pour "${event.title}"`,
    text: `Bonjour ${passengerFirstName},

Bonne nouvelle ! Un conducteur est maintenant disponible pour l'événement "${event.title}".

Conducteur : ${driverFirstName} ${driverLastName}
Lieu de départ : ${departureLocation}
Heure de départ : ${departureTimeFormatted}
Places disponibles : ${availableSeats}

Événement :
- Date : ${eventDate}
- Lieu : ${event.location}, ${event.city}

Réservez votre place maintenant : ${BASE_URL}/events/${event.id}/public

Cordialement,
${company.name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .driver-card { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Conducteur disponible !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${passengerFirstName},</p>
      
      <p>Bonne nouvelle ! Un conducteur est maintenant disponible pour vous emmener à l'événement <strong>"${event.title}"</strong>.</p>
      
      <div class="driver-card">
        <h3 style="margin-top: 0; color: #10b981;">👤 ${driverFirstName} ${driverLastName}</h3>
        <p><strong>📍 Lieu de départ :</strong> ${departureLocation}</p>
        <p><strong>🕐 Heure de départ :</strong> ${departureTimeFormatted}</p>
        <p><strong>💺 Places disponibles :</strong> ${availableSeats}</p>
      </div>
      
      <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px;">
        <p><strong>📅 Événement :</strong> ${event.title}</p>
        <p><strong>📍 Lieu :</strong> ${event.location}, ${event.city}</p>
        <p><strong>🕐 Date :</strong> ${eventDate}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${BASE_URL}/events/${event.id}/public" class="button">Réserver ma place</a>
      </div>
      
      <p style="font-size: 14px; color: #777;">Les places sont limitées. Réservez vite !</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE - ${company.name}</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

interface BookingConfirmationEmailData {
  passengerEmail: string;
  passengerFirstName: string;
  event: Event;
  company: Company;
  driverFirstName: string;
  driverLastName: string;
  departureLocation: string;
  departureTime: Date;
}

export async function sendBookingConfirmationEmail(data: BookingConfirmationEmailData): Promise<boolean> {
  const { passengerEmail, passengerFirstName, event, company, driverFirstName, driverLastName, departureLocation, departureTime } = data;
  
  const eventDate = new Date(event.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const departureTimeFormatted = new Date(departureTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const msg: sgMail.MailDataRequired = {
    to: passengerEmail,
    from: FROM_EMAIL,
    subject: `✅ Réservation confirmée pour "${event.title}"`,
    text: `Bonjour ${passengerFirstName},

Votre réservation est confirmée pour l'événement "${event.title}".

Votre conducteur :
${driverFirstName} ${driverLastName}

Détails du trajet :
- Lieu de départ : ${departureLocation}
- Heure de départ : ${departureTimeFormatted}

Événement :
- Date : ${eventDate}
- Lieu : ${event.location}, ${event.city}

Bon voyage !

Cordialement,
${company.name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-card { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Réservation confirmée</h1>
    </div>
    <div class="content">
      <p>Bonjour ${passengerFirstName},</p>
      
      <p>Votre réservation est confirmée pour l'événement <strong>"${event.title}"</strong>.</p>
      
      <div class="info-card">
        <h3 style="margin-top: 0; color: #3b82f6;">🚗 Votre conducteur</h3>
        <p><strong>👤 Nom :</strong> ${driverFirstName} ${driverLastName}</p>
        <p><strong>📍 Lieu de départ :</strong> ${departureLocation}</p>
        <p><strong>🕐 Heure de départ :</strong> ${departureTimeFormatted}</p>
      </div>
      
      <div class="info-card">
        <h3 style="margin-top: 0; color: #3b82f6;">📅 Détails de l'événement</h3>
        <p><strong>Événement :</strong> ${event.title}</p>
        <p><strong>📍 Lieu :</strong> ${event.location}, ${event.city}</p>
        <p><strong>🕐 Date :</strong> ${eventDate}</p>
      </div>
      
      <p><strong>💡 N'oubliez pas :</strong></p>
      <ul>
        <li>Soyez ponctuel au point de départ</li>
        <li>Ayez votre téléphone avec vous</li>
        <li>Respectez les règles du covoiturage</li>
      </ul>
      
      <p>Bon voyage et profitez bien de l'événement ! 🎉</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TEAMMOVE - ${company.name}</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  return sendEmail(msg);
}

export default {
  sendWelcomeEmail,
  sendEventCreatedEmail,
  sendParticipantInvitation,
  sendPaymentFailedEmail,
  sendEventReminderEmail,
  sendNoDriverAlertEmail,
  sendSupportNotificationEmail,
  sendDriverAvailableEmail,
  sendBookingConfirmationEmail,
};
