<!DOCTYPE html>
<html lang="en">
  <head>
    <title>kontact</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <form action="mail.php" method="post" class="kontact">
      <div><label for="name">Name</label><input type="text" name="name" id="name" value="<?php echo @$_GET['data']['name']; ?>" /></div>
      <div><label for="email">Email</label><input type="text" name="email" id="email" value="<?php echo @$_GET['data']['email']; ?>" /></div>
      <div><label for="email">Message</label><textarea name="message" id="message"><?php echo @$_GET['data']['message']; ?></textarea></div>
      <div><input type="submit" value="Send" /></div>
    </form>
    <script src="../js/src/kontact.min.js"></script>
    <script src="script.js"></script>
  </body>
</html>
