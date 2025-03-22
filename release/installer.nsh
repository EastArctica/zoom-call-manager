!macro customInstall
  ${ifNot} ${isUpdated}
    WriteRegStr HKCU "Software\Zoom Call Manager\Capabilities" "ApplicationName" "Zoom Call Manager"
    WriteRegStr HKCU "Software\Zoom Call Manager\Capabilities" "ApplicationDescription" "Zoom Call Manager"

    WriteRegStr HKCU "Software\Zoom Call Manager\Capabilities\URLAssociations" "tel" "Zoom Call Manager.tel"

    WriteRegStr HKCU "Software\Classes\Zoom Call Manager.tel\DefaultIcon" "" "$INSTDIR\Zoom Call Manager.exe"
    WriteRegStr HKCU "Software\Classes\Zoom Call Manager.tel\shell\open\command" "" '"$INSTDIR\Zoom Call Manager.exe" "%1"'

    WriteRegStr HKCU "Software\RegisteredApplications" "Zoom Call Manager" "Software\Zoom Call Manager\Capabilities"
  ${endIf}
!macroend
