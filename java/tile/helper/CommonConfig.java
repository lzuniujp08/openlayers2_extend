package com.lzugis.tile.helper;

import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.XMLConfiguration;
import org.apache.commons.configuration.reloading.FileChangedReloadingStrategy;
  
/**
 * @描述 
 * 该类用来替代属性文件类，
 * 	既可以直接写中文配置，而且利于分组配置，结构更灵活
 *  本类主要在常量类中调用，重载模式为文件修改后后重载：
 *  既避免了每次都加载，又避免了每次修改都需要重启生效
 *  本类为单例模式，可以给读取XML文件提供基本参考，不支持XML其他文件加载
 *  其他配置文件，如excel导出的模板文件需要另外配置，不应该使用本类
 * 基本用法：
 *  
 *  <?xml version="1.0" encoding="ISO-8859-1" ?> 
	<gui-definition> 
		  <colors> 
			<background>#808080</background> 
			<text>#000000</text> 
			<header>#008000</header> 
			<link normal="#000080" visited="#800080"/> 
			<default>${colors.header}</default> 
		  </colors> 
		  <rowsPerPage>15</rowsPerPage> 
		  <buttons> 
			<name>OK,Cancel,Help</name> 
		  </buttons> 
	  <numberFormat pattern="###\,###.##"/> 
	</gui-definition> 

XMLConfiguration config = new XMLConfiguration("tables.xml"); 
//获取节点值  路径中不包括根节点名 
String backColor = config.getString("colors.background"); 
//获取节点属性值 
String linkNormal = config.getString("colors.link[@normal]"); 
//获取列表 
List buttons = config.getList("buttons.name"); 
//获取逗号分割的列表 
String[] fireds = config.getStringArray("config.firends");  //config.firends = liguang,xuwenjian用逗号分割 
//tables.table(1).fields.field(2).name 从0开始计数 


 * @author 
 *
 */
public class CommonConfig {

	private static CommonConfig commonConfig  = new CommonConfig();
	
	private final String configName = "config/common.xml";
	
	private XMLConfiguration config = null;
	
	private CommonConfig(){
		try {
			config = new XMLConfiguration(configName);
			config.setReloadingStrategy(new FileChangedReloadingStrategy());
		} catch (ConfigurationException e) {
			e.printStackTrace();
		}
	}
	
	public static XMLConfiguration getSysConfig(){
		return commonConfig.config;
	}
	
	private String nullToStr(String oldStr) {
        if (oldStr == null) {
            return "" ;
        }
        return oldStr.trim() ;
    }
	
	public String getString(String key,String defaultVal){
		try{
			return nullToStr(config.getString(key,defaultVal));
		}catch(Exception e){
			return defaultVal;
		}
	}
	
	public int getInt(String key,int defaultVal){
		try{
			return config.getInt(key,defaultVal);
		}catch(Exception e){
			return defaultVal;
		}
	}
	
	public float getFloat(String key,float defaultVal){
		try{
			return config.getFloat(key,defaultVal);
		}catch(Exception e){
			return defaultVal;
		}
	}
	
	public static String getVal(String key){
		return commonConfig.getString(key, "");	
	}
	
	public static String getVal(String key,String defaultVal){
		return commonConfig.getString(key, defaultVal);
	}
	
	public static int getIntVal(String key){
		return commonConfig.getInt(key,0);
	}
	
	public static int getIntVal(String key,int defaultVal){
		return commonConfig.getInt(key,defaultVal);
		
	}
	public static float getFloatVal(String key){
		return commonConfig.getFloat(key,0);
	}
	
	public static float getFloatVal(String key,int defaultVal){
		return commonConfig.getFloat(key,defaultVal);
		
	}
	
	public static void main(String[] args) {
		 System.out.println(CommonConfig.getVal("tile.path"));
	}
			
}

