<?php
// TNBuilt West — "Tell us what you're building" form handler (Hostinger / standard PHP).
// Sends the request to $TO with uploaded project files attached (max 25 MB total).
$TO   = 'info@tnb-west.com';
$FROM = 'website@tnb-west.com';   // create this mailbox in Hostinger (or change to an existing address on the domain)
$MAX  = 25 * 1024 * 1024;
$ALLOWED = ['pdf','dwg','dxf','step','stp','skp','rvt','zip','jpg','jpeg','png','webp'];

header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }
if (!empty($_POST['website'])) { echo json_encode(['ok'=>true]); exit; } // honeypot

function f($k){ return trim(strip_tags($_POST[$k] ?? '')); }
$name = str_replace(["\r","\n"], ' ', f('name'));
$email = filter_var(f('email'), FILTER_VALIDATE_EMAIL);
if (!$name || !$email) { http_response_code(422); echo json_encode(['ok'=>false]); exit; }

$fields = [
  'Name' => $name, 'Company' => f('company'), 'Email' => $email, 'Country' => f('country'),
  'Phone / WhatsApp' => f('phone'), 'Building' => f('type'), 'Files link' => f('link'), 'Language' => f('lang'),
];
$body = "New project request from tnb-west.com\n\n";
foreach ($fields as $k => $v) { if ($v !== '') $body .= str_pad($k.':', 18) . $v . "\n"; }
$body .= "\nMessage:\n" . f('message') . "\n";

// attachments
$atts = []; $total = 0;
if (!empty($_FILES['files']) && is_array($_FILES['files']['name'])) {
  foreach ($_FILES['files']['name'] as $i => $fn) {
    if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) continue;
    $ext = strtolower(pathinfo($fn, PATHINFO_EXTENSION));
    if (!in_array($ext, $ALLOWED, true)) continue;
    $total += $_FILES['files']['size'][$i];
    if ($total > $MAX) { http_response_code(413); echo json_encode(['ok'=>false,'error'=>'too_big']); exit; }
    $atts[] = ['name' => preg_replace('/[^\w.\- ]+/u', '_', $fn), 'data' => file_get_contents($_FILES['files']['tmp_name'][$i])];
  }
}

$subject = '=?UTF-8?B?' . base64_encode("New project request – {$fields['Building']} – $name") . '?=';
$b = 'tnb_' . md5(uniqid('', true));
$headers = "From: TNBuilt West Website <$FROM>\r\nReply-To: $email\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$b\"\r\n";
$msg  = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$body\r\n";
foreach ($atts as $a) {
  $msg .= "--$b\r\nContent-Type: application/octet-stream; name=\"{$a['name']}\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n" . chunk_split(base64_encode($a['data'])) . "\r\n";
}
$msg .= "--$b--";

$ok = @mail($TO, $subject, $msg, $headers);
echo json_encode(['ok' => (bool)$ok]);
