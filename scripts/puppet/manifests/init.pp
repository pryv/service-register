class reg($hostclass, $app, $slaveof) {
  
  notify{"reg $app slaveof: $slaveof ":}
  
  # package 
  package {
    'tcl8.5': ensure => installed;
  }
  
  # used by upstart template
  $appcode = "reg"   
  $appdir = "$::livedir/$app"
  $configdest = "$appdir.conf.json"
  
  $nodeversion = 'v0.8.2'
  $redisversion = '2.4.16'
  
  # test deployed custom point
  file{"/tmp/$app.commit":
    source => "puppet:///deployed/$app.commit",
    notify => Exec["/tmp/commit2"],
  }
  exec{'/tmp/commit2':
    command => "cp /tmp/commit /tmp/commit2",
    require => File["/tmp/$app.commit"],
  }

  file{"/tmp/$app.tar.gz":
    source  => "puppet:///deployed/$app.tar.gz",
    notify  => Exec["remove old $app"],
    require => File["$::livedir"],
  }
  exec{"remove old $app":
    command => "rm -rf $app",
    cwd     => "$::livedir", 
    require => File["/tmp/$app.tar.gz"],
  }
  exec{"uncompress $app.tar.gz":
    command => "mv /tmp/$app.tar.gz .; tar xfz $app.tar.gz",
    cwd     => "$::livedir", 
    require => Exec["remove old $app"],
  }
  exec{"run $app.setup.bash":
    command => "bash $app.setup.bash",
    cwd     => "$::livedir", 
    require => Exec["uncompress $app.tar.gz"],
  }

  # dependencies
  class{'nodesetup': nodeversion => $nodeversion, }
  class{'redis': 
    redisversion  => $redisversion,
    slaveof       => $slaveof,
  }
  
  # app dir
  file {"$appdir":
    ensure  => 'directory',
    mode    => '0644',
    require => File["$::livedir"],
  }
  
  if ($app == "staging-registration-server") {
     $nodeenv = "developement"
     $staging = ".staging"
     secret::ssl{"rec.la": }
     $httpcerts = "$::livedir/secret/rec.la"
  } else {
     $nodeenv = "production"
     $staging = ""
     secret::ssl{"pryv.io": }
     $httpcerts = "$::livedir/secret/pryv.io" 
  } 
  
  if ($slaveof) {
    $configname = "dnsonly"
  } else {
    $configname = "master"
  }

  # app conf file
  file {'app config file':
    path    => $configdest,
    ensure  => 'file',
    mode    => '0644',
    content => template("reg/$configname${staging}.config.json.erb"),
    require => File["$appdir"],
  }
  
  file {"reg setup script":
    path    =>  "$appdir.setup.bash",
    ensure  => 'file',
    content => template("reg/setup-app.erb"),
    mode    => '755',
    require => File["$appdir"],
  }
   
  file {"upstart":
    path    =>  "/etc/init/reg.conf",
    ensure  => 'file',
    content => template("head/upstart-default-nodeapp.conf.erb"),
    mode    => '644',
    require => [Exec["supervisor"], File["app config file"]],
  }
}
